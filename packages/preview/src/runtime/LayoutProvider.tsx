import initLayoutEngine, { compute_layout } from "@lattice-ui/layout-engine";
import layoutEngineWasmUrl from "@lattice-ui/layout-engine/layout_engine_bg.wasm?url";
import * as React from "react";
import type { UDim2Value, Vector2 } from "./helpers";

export type ComputedRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Vector2Like = Vector2 | { X?: number; Y?: number; x?: number; y?: number };

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
  size?: UDim2Value;
  position?: UDim2Value;
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
};

const SYNTHETIC_ROOT_ID = "__lattice_preview_root__";
const DEFAULT_DEBOUNCE_MS = 12;

const LayoutContext = React.createContext<LayoutContextValue | null>(null);
const ParentNodeContext = React.createContext<string | undefined>(undefined);

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

function toSolverUDim(axis: { Scale?: number; Offset?: number } | undefined): SolverUDim {
  return {
    scale: toFiniteNumber(axis?.Scale, 0),
    offset: toFiniteNumber(axis?.Offset, 0),
  };
}

function toSolverUDim2(value: UDim2Value | undefined, nodeType: string): SolverUDim2 {
  if (!value) {
    if (nodeType === "ScreenGui") {
      return {
        x: { scale: 1, offset: 0 },
        y: { scale: 1, offset: 0 },
      };
    }

    return {
      x: { scale: 0, offset: 0 },
      y: { scale: 0, offset: 0 },
    };
  }

  return {
    x: toSolverUDim(value.X),
    y: toSolverUDim(value.Y),
  };
}


function normalizeLayoutMap(raw: unknown): Record<string, ComputedRect> {
  let entries: Array<[string, unknown]> = [];

  if (raw instanceof Map) {
    entries = Array.from(raw.entries()) as Array<[string, unknown]>;
  } else if (raw && typeof raw === "object") {
    entries = Object.entries(raw as Record<string, unknown>);
  } else {
    throw new Error(`Unexpected compute_layout result type: ${typeof raw}`);
  }

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

    next[key] = rect;
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
  const buildNode = (node: RegisteredNode): SolverNode => {
    if (stack.has(node.id)) {
      return {
        id: node.id,
        node_type: node.nodeType,
        size: node.size,
        position: node.position,
        anchor_point: node.anchorPoint,
        children: [],
      };
    }

    stack.add(node.id);
    const children = (byParentId.get(node.id) ?? []).map((child) => buildNode(child));
    stack.delete(node.id);

    return {
      id: node.id,
      node_type: node.nodeType,
      size: node.size,
      position: node.position,
      anchor_point: node.anchorPoint,
      children,
    };
  };

  return {
    id: SYNTHETIC_ROOT_ID,
    node_type: "Frame",
    size: {
      x: { scale: 1, offset: 0 },
      y: { scale: 1, offset: 0 },
    },
    position: {
      x: { scale: 0, offset: 0 },
      y: { scale: 0, offset: 0 },
    },
    anchor_point: { x: 0, y: 0 },
    children: roots.map((root) => buildNode(root)),
  };
}

function useWindowViewport() {
  const [viewport, setViewport] = React.useState(() => ({
    width: typeof window === "undefined" ? 0 : window.innerWidth,
    height: typeof window === "undefined" ? 0 : window.innerHeight,
  }));

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const update = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    update();
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("resize", update);
    };
  }, []);

  return viewport;
}

export function LayoutProvider(props: LayoutProviderProps) {
  const fallbackViewport = useWindowViewport();
  const viewportWidth = props.viewportWidth ?? fallbackViewport.width;
  const viewportHeight = props.viewportHeight ?? fallbackViewport.height;
  const debounceMs = props.debounceMs ?? DEFAULT_DEBOUNCE_MS;

  const [isReady, setIsReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [registry, setRegistry] = React.useState<Map<string, RegisteredNode>>(() => new Map());
  const [computedRects, setComputedRects] = React.useState<Record<string, ComputedRect>>({});

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
    if (!isReady) {
      setComputedRects({});
      return;
    }

    if (viewportWidth <= 0 || viewportHeight <= 0) {
      setComputedRects({});
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      try {
        const tree = buildSemanticTree(registry);
        const rawResult = compute_layout(tree, viewportWidth, viewportHeight) as unknown;
        const normalized = normalizeLayoutMap(rawResult);
        delete normalized[SYNTHETIC_ROOT_ID];
        setComputedRects(normalized);
        setError(null);
      } catch (nextError) {
        setComputedRects({});
        setError(`Wasm layout failed: ${toErrorMessage(nextError)}`);
      }
    }, Math.max(0, debounceMs));

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [debounceMs, error, isReady, registry, viewportHeight, viewportWidth]);

  const getRect = React.useCallback(
    (nodeId: string) => {
      return computedRects[nodeId] ?? null;
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
    }),
    [error, getRect, isReady, registerNode, unregisterNode],
  );

  return (
    <LayoutContext.Provider value={contextValue}>
      <ParentNodeContext.Provider value={undefined}>{props.children}</ParentNodeContext.Provider>
    </LayoutContext.Provider>
  );
}

export function LayoutNodeParentProvider(props: { children: React.ReactNode; nodeId: string }) {
  return <ParentNodeContext.Provider value={props.nodeId}>{props.children}</ParentNodeContext.Provider>;
}

export function useLayoutEngineStatus() {
  const context = React.useContext(LayoutContext);
  return {
    error: context?.error ?? null,
    isReady: context?.isReady ?? false,
  };
}

export function useRobloxLayout(input: RobloxLayoutNodeInput): ComputedRect | null {
  const context = React.useContext(LayoutContext);
  const inheritedParentId = React.useContext(ParentNodeContext);

  const parentId = input.parentId ?? inheritedParentId;

  const sizeXScale = toFiniteNumber(input.size?.X?.Scale, 0);
  const sizeXOffset = toFiniteNumber(input.size?.X?.Offset, 0);
  const sizeYScale = toFiniteNumber(input.size?.Y?.Scale, 0);
  const sizeYOffset = toFiniteNumber(input.size?.Y?.Offset, 0);

  const positionXScale = toFiniteNumber(input.position?.X?.Scale, 0);
  const positionXOffset = toFiniteNumber(input.position?.X?.Offset, 0);
  const positionYScale = toFiniteNumber(input.position?.Y?.Scale, 0);
  const positionYOffset = toFiniteNumber(input.position?.Y?.Offset, 0);

  const anchorSource = input.anchorPoint as { X?: number; Y?: number; x?: number; y?: number } | undefined;
  const anchorX = toFiniteNumber(anchorSource?.X ?? anchorSource?.x, 0);
  const anchorY = toFiniteNumber(anchorSource?.Y ?? anchorSource?.y, 0);

  const normalizedNode = React.useMemo<RegisteredNode>(
    () => ({
      id: input.id,
      parentId,
      nodeType: input.nodeType,
      size:
        input.size === undefined
          ? toSolverUDim2(undefined, input.nodeType)
          : {
              x: { scale: sizeXScale, offset: sizeXOffset },
              y: { scale: sizeYScale, offset: sizeYOffset },
            },
      position: {
        x: { scale: positionXScale, offset: positionXOffset },
        y: { scale: positionYScale, offset: positionYOffset },
      },
      anchorPoint: { x: anchorX, y: anchorY },
    }),
    [
      anchorX,
      anchorY,
      input.id,
      input.nodeType,
      input.size,
      parentId,
      positionXOffset,
      positionXScale,
      positionYOffset,
      positionYScale,
      sizeXOffset,
      sizeXScale,
      sizeYOffset,
      sizeYScale,
    ],
  );

  React.useEffect(() => {
    if (!context) {
      return;
    }

    context.registerNode(normalizedNode);
    return () => {
      context.unregisterNode(normalizedNode.id);
    };
  }, [context, normalizedNode]);

  if (!context || !context.isReady || context.error) {
    return null;
  }

  return context.getRect(normalizedNode.id);
}




