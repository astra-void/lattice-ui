import * as React from "react";
import { normalizePreviewNodeId } from "../internal/robloxValues";
import {
  adaptRobloxNodeInput,
  areNodesEqual,
  type ComputedRect,
  computeRectFromParentRect,
  createViewportRect,
  normalizeRootScreenGuiNode,
  type RegisteredNode,
  type RobloxLayoutRegistrationInput,
  type RobloxLayoutNodeInput,
} from "./model";
import { createLayoutTreeState, removeLayoutTreeNode, upsertLayoutTreeNode, type LayoutTreeState } from "./tree";
import {
  areViewportsEqual,
  createViewportSize,
  DEFAULT_VIEWPORT_HEIGHT,
  DEFAULT_VIEWPORT_WIDTH,
  hasPositiveViewport,
  measureElementViewport,
  type ViewportSize,
} from "./viewport";
import { computeFallbackLayout, computeRegisteredLayout, initializeLayoutEngine } from "./wasm";

export type { ComputedRect, RobloxLayoutNodeInput, RobloxLayoutRegistrationInput } from "./model";

export type LayoutProviderProps = {
  children: React.ReactNode;
  debounceMs?: number;
  viewportHeight?: number;
  viewportWidth?: number;
};

type LayoutContextValue = {
  error: string | null;
  getRect: (nodeId: string) => ComputedRect | null;
  isReady: boolean;
  registerNode: (node: RegisteredNode) => void;
  unregisterNode: (nodeId: string) => void;
  viewport: ViewportSize;
  viewportReady: boolean;
};

const DEFAULT_DEBOUNCE_MS = 12;
const ZERO_VIEWPORT: ViewportSize = {
  height: 0,
  width: 0,
};
const LAYOUT_CONTEXTS_GLOBAL_KEY = "__lattice_preview_layout_contexts__";

type LayoutContexts = {
  layout: React.Context<LayoutContextValue | null>;
  parentNode: React.Context<string | undefined>;
  parentRect: React.Context<ComputedRect | null>;
};

function getSharedLayoutContexts(): LayoutContexts {
  const globalRecord = globalThis as typeof globalThis & {
    [LAYOUT_CONTEXTS_GLOBAL_KEY]?: LayoutContexts;
  };

  if (!globalRecord[LAYOUT_CONTEXTS_GLOBAL_KEY]) {
    globalRecord[LAYOUT_CONTEXTS_GLOBAL_KEY] = {
      layout: React.createContext<LayoutContextValue | null>(null),
      parentNode: React.createContext<string | undefined>(undefined),
      parentRect: React.createContext<ComputedRect | null>(null),
    };
  }

  return globalRecord[LAYOUT_CONTEXTS_GLOBAL_KEY];
}

const sharedLayoutContexts = getSharedLayoutContexts();
const LayoutContext = sharedLayoutContexts.layout;
const ParentNodeContext = sharedLayoutContexts.parentNode;
const ParentRectContext = sharedLayoutContexts.parentRect;

function scheduleMicrotask(callback: () => void): void {
  if (typeof globalThis.queueMicrotask === "function") {
    globalThis.queueMicrotask(callback);
    return;
  }

  void Promise.resolve().then(callback);
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function useMeasuredViewport(containerRef: React.RefObject<HTMLDivElement | null>): ViewportSize | null {
  const [viewport, setViewport] = React.useState<ViewportSize | null>(null);

  React.useLayoutEffect(() => {
    const element = containerRef.current;
    const measurementElement = element?.parentElement ?? element;
    if (!measurementElement) {
      return;
    }

    const update = (nextViewport?: ViewportSize | null) => {
      const next = nextViewport ?? measureElementViewport(measurementElement);
      setViewport((previous) => (areViewportsEqual(previous, next) ? previous : next));
    };

    update();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver((entries) => {
        const entry = entries.find((candidate) => candidate.target === measurementElement) ?? entries[0];
        update(createViewportSize(entry?.contentRect.width, entry?.contentRect.height));
      });
      observer.observe(measurementElement);

      return () => {
        observer.disconnect();
      };
    }

    if (typeof window === "undefined") {
      return;
    }

    const handleWindowResize = () => {
      update();
    };

    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [containerRef]);

  return viewport;
}

export function LayoutProvider(props: LayoutProviderProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const measuredViewport = useMeasuredViewport(containerRef);
  const explicitViewport = React.useMemo(
    () => createViewportSize(props.viewportWidth, props.viewportHeight),
    [props.viewportHeight, props.viewportWidth],
  );
  const resolvedViewport = React.useMemo(() => {
    if (hasPositiveViewport(measuredViewport)) {
      return measuredViewport;
    }

    if (hasPositiveViewport(explicitViewport)) {
      return explicitViewport;
    }

    if (measuredViewport !== null) {
      return null;
    }

    return explicitViewport;
  }, [explicitViewport, measuredViewport]);
  const viewportSource = React.useMemo(() => {
    if (hasPositiveViewport(measuredViewport)) {
      return "measured-parent";
    }

    if (hasPositiveViewport(explicitViewport)) {
      return "explicit";
    }

    if (measuredViewport !== null) {
      return "unresolved";
    }

    return "none";
  }, [explicitViewport, measuredViewport]);
  const viewportReady = hasPositiveViewport(resolvedViewport);
  const viewportWidth = resolvedViewport?.width ?? 0;
  const viewportHeight = resolvedViewport?.height ?? 0;
  const debounceMs = props.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const viewportRect = React.useMemo(
    () => (viewportReady ? createViewportRect(viewportWidth, viewportHeight) : null),
    [viewportHeight, viewportReady, viewportWidth],
  );

  const [isReady, setIsReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [treeState, setTreeState] = React.useState<LayoutTreeState>(() => createLayoutTreeState());
  const treeStateRef = React.useRef(treeState);
  const [settledTreeVersion, setSettledTreeVersion] = React.useState(0);
  const [computedRects, setComputedRects] = React.useState<Record<string, ComputedRect>>({});
  const containerStyle = React.useMemo<React.CSSProperties>(
    () => ({
      display: "block",
      height: "100%",
      minHeight: "500px",
      position: "relative",
      visibility: viewportReady ? "visible" : "hidden",
      width: "100%",
    }),
    [viewportReady],
  );

  React.useEffect(() => {
    let cancelled = false;

    initializeLayoutEngine()
      .then(() => {
        if (!cancelled) {
          setIsReady(true);
          setError(null);
        }
      })
      .catch((nextError: unknown) => {
        if (!cancelled) {
          setIsReady(false);
          setError(`Wasm init failed: ${toErrorMessage(nextError)}`);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const registerNode = React.useCallback((node: RegisteredNode) => {
    setTreeState((previous) => {
      const existing = previous.nodes.get(node.id)?.node;
      if (existing && areNodesEqual(existing, node)) {
        return previous;
      }

      return upsertLayoutTreeNode(previous, node);
    });
  }, []);

  const unregisterNode = React.useCallback((nodeId: string) => {
    setTreeState((previous) => {
      if (!previous.nodes.has(nodeId)) {
        return previous;
      }

      return removeLayoutTreeNode(previous, nodeId);
    });
  }, []);

  React.useEffect(() => {
    treeStateRef.current = treeState;
  }, [treeState]);

  React.useEffect(() => {
    let cancelled = false;

    scheduleMicrotask(() => {
      if (!cancelled) {
        setSettledTreeVersion((previous) => previous + 1);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [treeState]);

  React.useEffect(() => {
    if (!viewportReady) {
      setComputedRects({});
      return;
    }

    if (treeStateRef.current.nodes.size === 0) {
      setComputedRects({});
      setError(null);
      return;
    }

    const timeoutId = globalThis.setTimeout(
      () => {
        try {
          if (isReady) {
            setComputedRects(computeRegisteredLayout(treeStateRef.current, viewportWidth, viewportHeight));
            setError(null);
            return;
          }

          setComputedRects(computeFallbackLayout(treeStateRef.current, viewportWidth, viewportHeight));
        } catch (nextError) {
          setComputedRects(computeFallbackLayout(treeStateRef.current, viewportWidth, viewportHeight));
          setError(`Wasm layout failed: ${toErrorMessage(nextError)}`);
        }
      },
      Math.max(0, debounceMs),
    );

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [debounceMs, isReady, settledTreeVersion, viewportHeight, viewportReady, viewportWidth]);

  const getRect = React.useCallback(
    (nodeId: string) => {
      const normalizedNodeId = normalizePreviewNodeId(nodeId) ?? nodeId;
      return computedRects[normalizedNodeId] ?? null;
    },
    [computedRects],
  );

  const contextValue = React.useMemo<LayoutContextValue>(
    () => ({
      error,
      getRect,
      isReady,
      registerNode,
      unregisterNode,
      viewport: resolvedViewport ?? ZERO_VIEWPORT,
      viewportReady,
    }),
    [error, getRect, isReady, registerNode, resolvedViewport, unregisterNode, viewportReady],
  );

  return (
    <LayoutContext.Provider value={contextValue}>
      <div
        data-preview-layout-provider=""
        data-preview-viewport-height={viewportHeight || undefined}
        data-preview-viewport-ready={viewportReady ? "true" : "false"}
        data-preview-viewport-source={viewportSource}
        data-preview-viewport-width={viewportWidth || undefined}
        ref={containerRef}
        style={containerStyle}
      >
        <ParentRectContext.Provider value={viewportRect}>
          <ParentNodeContext.Provider value={undefined}>{props.children}</ParentNodeContext.Provider>
        </ParentRectContext.Provider>
      </div>
    </LayoutContext.Provider>
  );
}

export function LayoutNodeParentProvider(props: {
  children: React.ReactNode;
  nodeId: string;
  rect: ComputedRect | null;
}) {
  return (
    <ParentRectContext.Provider value={props.rect}>
      <ParentNodeContext.Provider value={props.nodeId}>{props.children}</ParentNodeContext.Provider>
    </ParentRectContext.Provider>
  );
}

export function useLayoutEngineStatus() {
  const context = React.useContext(LayoutContext);
  return {
    error: context?.error ?? null,
    isReady: context?.isReady ?? false,
  };
}

export function useLayoutDebugState() {
  const context = React.useContext(LayoutContext);
  const inheritedParentRect = React.useContext(ParentRectContext);

  return React.useMemo(
    () => ({
      hasContext: context !== null,
      inheritedParentRect,
      viewport: context?.viewport ?? null,
      viewportReady: context?.viewportReady ?? false,
    }),
    [context, inheritedParentRect],
  );
}

export function useRobloxLayout(input: RobloxLayoutRegistrationInput): ComputedRect | null {
  const context = React.useContext(LayoutContext);
  const inheritedParentId = React.useContext(ParentNodeContext);
  const inheritedParentRect = React.useContext(ParentRectContext);
  const parentId = input.parentId ?? inheritedParentId;
  const normalizedNode = React.useMemo(() => adaptRobloxNodeInput(input, parentId), [input, parentId]);
  const fallbackViewportWidth = context?.viewport.width ?? DEFAULT_VIEWPORT_WIDTH;
  const fallbackViewportHeight = context?.viewport.height ?? DEFAULT_VIEWPORT_HEIGHT;
  const fallbackViewportRect = React.useMemo(
    () => createViewportRect(fallbackViewportWidth, fallbackViewportHeight),
    [fallbackViewportHeight, fallbackViewportWidth],
  );
  const fallbackParentRect = inheritedParentRect ?? fallbackViewportRect;
  const fallbackLayoutNode = React.useMemo(
    () => (parentId === undefined ? normalizeRootScreenGuiNode(normalizedNode) : normalizedNode),
    [normalizedNode, parentId],
  );

  const fallbackRect = React.useMemo<ComputedRect>(
    () => computeRectFromParentRect(fallbackLayoutNode, fallbackParentRect),
    [fallbackLayoutNode, fallbackParentRect],
  );

  const registerNode = context?.registerNode;
  const unregisterNode = context?.unregisterNode;
  const computed = context ? context.getRect(normalizedNode.id) : null;

  React.useLayoutEffect(() => {
    if (!registerNode || !unregisterNode) {
      return;
    }

    registerNode(normalizedNode);
    return () => {
      unregisterNode(normalizedNode.id);
    };
  }, [normalizedNode, registerNode, unregisterNode]);

  if (context && !context.viewportReady) {
    return null;
  }

  return computed ?? fallbackRect;
}
