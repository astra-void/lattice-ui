import initLayoutEngine, { compute_layout } from "@lattice-ui/layout-engine";
import layoutEngineWasmUrl from "@lattice-ui/layout-engine/layout_engine_bg.wasm?url";
import * as React from "react";
import type { UDim2Value, Vector2 } from "./helpers";
import {
  areViewportsEqual,
  createViewportSize,
  DEFAULT_VIEWPORT_HEIGHT,
  DEFAULT_VIEWPORT_WIDTH,
  hasPositiveViewport,
  measureElementViewport,
  type ViewportSize,
} from "./viewport";

export type ComputedRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type UDimLike = { Scale?: number; Offset?: number; scale?: number; offset?: number } | readonly [number, number];

type UDim2Like =
  | UDim2Value
  | { X?: UDimLike; Y?: UDimLike; x?: UDimLike; y?: UDimLike }
  | readonly [number, number, number, number]
  | readonly [UDimLike, UDimLike];

type Vector2Like = Vector2 | { X?: number; Y?: number; x?: number; y?: number } | readonly [number, number];

type SolverUDim = {
  scale: number;
  offset: number;
};

type SolverUDim2 = {
  x: SolverUDim;
  y: SolverUDim;
};

type SolverVector2 = {
  x: number;
  y: number;
};

type SolverNode = {
  Id: string;
  id: string;
  node_type: string;
  size: SolverUDim2;
  position: SolverUDim2;
  anchor_point: SolverVector2;
  children: SolverNode[];
};

type RegisteredNode = {
  id: string;
  parentId?: string;
  nodeType: string;
  size: SolverUDim2;
  position: SolverUDim2;
  anchorPoint: SolverVector2;
};

export type RobloxLayoutNodeInput = {
  id: string;
  parentId?: string;
  nodeType: string;
  size?: UDim2Like;
  position?: UDim2Like;
  anchorPoint?: Vector2Like;
};

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

const SYNTHETIC_ROOT_ID = "__lattice_preview_root__";
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
const PREVIEW_NODE_ID_PATTERN = /(?:^|:)(preview-node-\d+)$/;

function scheduleMicrotask(callback: () => void) {
  if (typeof globalThis.queueMicrotask === "function") {
    globalThis.queueMicrotask(callback);
    return;
  }

  void Promise.resolve().then(callback);
}

function normalizePreviewNodeId(nodeId: string | undefined): string | undefined {
  if (!nodeId) {
    return undefined;
  }

  const match = PREVIEW_NODE_ID_PATTERN.exec(nodeId);
  return match?.[1] ?? nodeId;
}

function createFullSizeUDim2(): SolverUDim2 {
  return {
    x: { scale: 1, offset: 0 },
    y: { scale: 1, offset: 0 },
  };
}

function createZeroUDim2(): SolverUDim2 {
  return {
    x: { scale: 0, offset: 0 },
    y: { scale: 0, offset: 0 },
  };
}

function createZeroVector(): SolverVector2 {
  return { x: 0, y: 0 };
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function createDefaultNodeSize(nodeType: string): SolverUDim2 {
  if (nodeType === "ScreenGui") {
    return createFullSizeUDim2();
  }

  return createZeroUDim2();
}

function toSolverUDim(axis: UDimLike | undefined, fallback: SolverUDim = { scale: 0, offset: 0 }): SolverUDim {
  if (Array.isArray(axis)) {
    return {
      scale: toFiniteNumber(axis[0], fallback.scale),
      offset: toFiniteNumber(axis[1], fallback.offset),
    };
  }

  const record = axis as { Scale?: number; Offset?: number; scale?: number; offset?: number } | undefined;
  return {
    scale: toFiniteNumber(record?.Scale ?? record?.scale, fallback.scale),
    offset: toFiniteNumber(record?.Offset ?? record?.offset, fallback.offset),
  };
}

function toSolverUDim2(value: UDim2Like | undefined, fallback: SolverUDim2): SolverUDim2 {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (Array.isArray(value)) {
    if (value.length >= 4) {
      return {
        x: toSolverUDim([value[0], value[1]], fallback.x),
        y: toSolverUDim([value[2], value[3]], fallback.y),
      };
    }

    const axisPair = value as readonly [UDimLike, UDimLike];
    return {
      x: toSolverUDim(axisPair[0], fallback.x),
      y: toSolverUDim(axisPair[1], fallback.y),
    };
  }

  const record = value as { X?: UDimLike; Y?: UDimLike; x?: UDimLike; y?: UDimLike };
  return {
    x: toSolverUDim(record.X ?? record.x, fallback.x),
    y: toSolverUDim(record.Y ?? record.y, fallback.y),
  };
}

function toSolverVector2(value: Vector2Like | undefined, fallback: SolverVector2 = createZeroVector()): SolverVector2 {
  if (Array.isArray(value)) {
    return {
      x: toFiniteNumber(value[0], fallback.x),
      y: toFiniteNumber(value[1], fallback.y),
    };
  }

  const record = value as { X?: number; Y?: number; x?: number; y?: number } | undefined;
  return {
    x: toFiniteNumber(record?.X ?? record?.x, fallback.x),
    y: toFiniteNumber(record?.Y ?? record?.y, fallback.y),
  };
}

// Rust serde expects snake_case node fields and lowercase axis keys.
function adaptRobloxNodeInput(input: RobloxLayoutNodeInput, parentId: string | undefined): RegisteredNode {
  return {
    id: normalizePreviewNodeId(input.id) ?? input.id,
    parentId: normalizePreviewNodeId(parentId),
    nodeType: input.nodeType,
    size: toSolverUDim2(input.size, createDefaultNodeSize(input.nodeType)),
    position: toSolverUDim2(input.position, createZeroUDim2()),
    anchorPoint: toSolverVector2(input.anchorPoint),
  };
}

function normalizeLayoutMap(raw: unknown): Record<string, ComputedRect> {
  if (!(raw instanceof Map) && !(raw && typeof raw === "object")) {
    throw new Error(`Unexpected compute_layout result type: ${typeof raw}`);
  }

  const entries =
    raw instanceof Map
      ? (Array.from(raw.entries()) as Array<[string, unknown]>)
      : Object.entries(raw as Record<string, unknown>);

  const next: Record<string, ComputedRect> = {};
  for (const [key, value] of entries) {
    if (!value || typeof value !== "object") {
      continue;
    }

    const record = value as Record<string, unknown>;
    const rect: ComputedRect = {
      x: toFiniteNumber(record.x, 0),
      y: toFiniteNumber(record.y, 0),
      width: toFiniteNumber(record.width, 0),
      height: toFiniteNumber(record.height, 0),
    };

    const normalizedKey = normalizePreviewNodeId(key) ?? key;
    next[normalizedKey] = rect;
  }

  return next;
}

function areNodesEqual(a: RegisteredNode, b: RegisteredNode): boolean {
  return (
    a.id === b.id &&
    a.parentId === b.parentId &&
    a.nodeType === b.nodeType &&
    a.size.x.scale === b.size.x.scale &&
    a.size.x.offset === b.size.x.offset &&
    a.size.y.scale === b.size.y.scale &&
    a.size.y.offset === b.size.y.offset &&
    a.position.x.scale === b.position.x.scale &&
    a.position.x.offset === b.position.x.offset &&
    a.position.y.scale === b.position.y.scale &&
    a.position.y.offset === b.position.y.offset &&
    a.anchorPoint.x === b.anchorPoint.x &&
    a.anchorPoint.y === b.anchorPoint.y
  );
}

function normalizeRootScreenGuiNode(node: RegisteredNode): RegisteredNode {
  if (node.nodeType !== "ScreenGui") {
    return node;
  }

  return {
    ...node,
    anchorPoint: createZeroVector(),
    position: createZeroUDim2(),
    size: createFullSizeUDim2(),
  };
}

function createViewportRect(width: number, height: number): ComputedRect {
  return {
    height,
    width,
    x: 0,
    y: 0,
  };
}

function resolveAxis(udim: SolverUDim, parentAxisSize: number) {
  return parentAxisSize * udim.scale + udim.offset;
}

function computeRectFromParentRect(
  node: Pick<RegisteredNode, "anchorPoint" | "position" | "size">,
  parentRect: ComputedRect,
): ComputedRect {
  const width = resolveAxis(node.size.x, parentRect.width);
  const height = resolveAxis(node.size.y, parentRect.height);

  return {
    height,
    width,
    x: parentRect.x + resolveAxis(node.position.x, parentRect.width) - node.anchorPoint.x * width,
    y: parentRect.y + resolveAxis(node.position.y, parentRect.height) - node.anchorPoint.y * height,
  };
}

function buildSemanticTree(nodes: Map<string, RegisteredNode>): SolverNode {
  const byParentId = new Map<string, RegisteredNode[]>();
  const roots: RegisteredNode[] = [];

  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) {
      const children = byParentId.get(node.parentId);
      if (children) {
        children.push(node);
      } else {
        byParentId.set(node.parentId, [node]);
      }
      continue;
    }

    roots.push(node);
  }

  const stack = new Set<string>();
  const buildNode = (node: RegisteredNode, isRoot = false): SolverNode => {
    const normalizedNode = isRoot ? normalizeRootScreenGuiNode(node) : node;

    if (stack.has(normalizedNode.id)) {
      return {
        Id: normalizedNode.id,
        id: normalizedNode.id,
        node_type: normalizedNode.nodeType,
        size: normalizedNode.size,
        position: normalizedNode.position,
        anchor_point: normalizedNode.anchorPoint,
        children: [],
      };
    }

    stack.add(normalizedNode.id);
    const children = (byParentId.get(normalizedNode.id) ?? []).map((child) => buildNode(child));
    stack.delete(normalizedNode.id);

    return {
      Id: normalizedNode.id,
      id: normalizedNode.id,
      node_type: normalizedNode.nodeType,
      size: normalizedNode.size,
      position: normalizedNode.position,
      anchor_point: normalizedNode.anchorPoint,
      children,
    };
  };

  return {
    Id: SYNTHETIC_ROOT_ID,
    id: SYNTHETIC_ROOT_ID,
    node_type: "Frame",
    size: createFullSizeUDim2(),
    position: createZeroUDim2(),
    anchor_point: createZeroVector(),
    children: roots.map((root) => buildNode(root, true)),
  };
}

function useMeasuredViewport(containerRef: React.RefObject<HTMLDivElement | null>) {
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
  const [registry, setRegistry] = React.useState<Map<string, RegisteredNode>>(() => new Map());
  const registryRef = React.useRef(registry);
  const [settledRegistryVersion, setSettledRegistryVersion] = React.useState(0);
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

    initLayoutEngine({ module_or_path: layoutEngineWasmUrl })
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
    setRegistry((previous) => {
      const existing = previous.get(node.id);
      if (existing && areNodesEqual(existing, node)) {
        return previous;
      }

      const next = new Map(previous);
      next.set(node.id, node);
      return next;
    });
  }, []);

  const unregisterNode = React.useCallback((nodeId: string) => {
    setRegistry((previous) => {
      if (!previous.has(nodeId)) {
        return previous;
      }

      const next = new Map(previous);
      next.delete(nodeId);
      return next;
    });

    setComputedRects((previous) => {
      if (!(nodeId in previous)) {
        return previous;
      }

      const next = { ...previous };
      delete next[nodeId];
      return next;
    });
  }, []);

  React.useEffect(() => {
    registryRef.current = registry;
  }, [registry]);

  React.useEffect(() => {
    let cancelled = false;

    // Wait one microtask so sibling registrations can settle before Wasm runs.
    scheduleMicrotask(() => {
      if (!cancelled) {
        setSettledRegistryVersion((previous) => previous + 1);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [registry]);

  React.useEffect(() => {
    if (!isReady) {
      setComputedRects({});
      return;
    }

    if (!viewportReady) {
      setComputedRects({});
      return;
    }

    if (registryRef.current.size === 0) {
      setComputedRects({});
      setError(null);
      return;
    }

    const timeoutId = globalThis.setTimeout(
      () => {
        try {
          const tree = buildSemanticTree(registryRef.current);
          const rawResult = compute_layout(tree, viewportWidth, viewportHeight) as unknown;
          const computedLayouts = normalizeLayoutMap(rawResult);
          delete computedLayouts[SYNTHETIC_ROOT_ID];
          setComputedRects(computedLayouts);
          setError(null);
        } catch (nextError) {
          setComputedRects({});
          setError(`Wasm layout failed: ${toErrorMessage(nextError)}`);
        }
      },
      Math.max(0, debounceMs),
    );

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [debounceMs, isReady, settledRegistryVersion, viewportHeight, viewportReady, viewportWidth]);

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

export function useRobloxLayout(input: RobloxLayoutNodeInput): ComputedRect | null {
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
  const computed = context && context.isReady && !context.error ? context.getRect(normalizedNode.id) : null;

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
