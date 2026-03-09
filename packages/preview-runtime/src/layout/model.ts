import {
  FULL_SIZE_UDIM2,
  normalizePreviewNodeId,
  type SerializedUDim,
  type SerializedUDim2,
  type SerializedVector2,
  serializeUDim2,
  serializeVector2,
  toFiniteNumber,
  type UDim2Like,
  type Vector2Like,
  ZERO_UDIM2,
  ZERO_VECTOR2,
} from "../internal/robloxValues";

export type ComputedRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

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

export type SolverNode = {
  Id: string;
  id: string;
  node_type: string;
  size: SolverUDim2;
  position: SolverUDim2;
  anchor_point: SolverVector2;
  children: SolverNode[];
};

export type RegisteredNode = {
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

export const SYNTHETIC_ROOT_ID = "__lattice_preview_root__";

function toSolverUDim(value: SerializedUDim): SolverUDim {
  return {
    offset: value.Offset,
    scale: value.Scale,
  };
}

function toSolverUDim2(value: SerializedUDim2): SolverUDim2 {
  return {
    x: toSolverUDim(value.X),
    y: toSolverUDim(value.Y),
  };
}

function toSolverVector2(value: SerializedVector2): SolverVector2 {
  return {
    x: value.X,
    y: value.Y,
  };
}

function createDefaultNodeSize(nodeType: string): SerializedUDim2 {
  if (nodeType === "ScreenGui") {
    return FULL_SIZE_UDIM2;
  }

  return ZERO_UDIM2;
}

export function adaptRobloxNodeInput(input: RobloxLayoutNodeInput, parentId: string | undefined): RegisteredNode {
  return {
    anchorPoint: toSolverVector2(serializeVector2(input.anchorPoint, ZERO_VECTOR2)),
    id: normalizePreviewNodeId(input.id) ?? input.id,
    nodeType: input.nodeType,
    parentId: normalizePreviewNodeId(parentId),
    position: toSolverUDim2(serializeUDim2(input.position, ZERO_UDIM2) ?? ZERO_UDIM2),
    size: toSolverUDim2(
      serializeUDim2(input.size, createDefaultNodeSize(input.nodeType)) ?? createDefaultNodeSize(input.nodeType),
    ),
  };
}

export function normalizeLayoutMap(raw: unknown): Record<string, ComputedRect> {
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
      height: toFiniteNumber(record.height, 0),
      width: toFiniteNumber(record.width, 0),
      x: toFiniteNumber(record.x, 0),
      y: toFiniteNumber(record.y, 0),
    };

    const normalizedKey = normalizePreviewNodeId(key) ?? key;
    next[normalizedKey] = rect;
  }

  return next;
}

export function areNodesEqual(a: RegisteredNode, b: RegisteredNode): boolean {
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

export function normalizeRootScreenGuiNode(node: RegisteredNode): RegisteredNode {
  if (node.nodeType !== "ScreenGui") {
    return node;
  }

  return {
    ...node,
    anchorPoint: toSolverVector2(ZERO_VECTOR2),
    position: toSolverUDim2(ZERO_UDIM2),
    size: toSolverUDim2(FULL_SIZE_UDIM2),
  };
}

export function createViewportRect(width: number, height: number): ComputedRect {
  return {
    height,
    width,
    x: 0,
    y: 0,
  };
}

function resolveAxis(udim: SolverUDim, parentAxisSize: number): number {
  return parentAxisSize * udim.scale + udim.offset;
}

export function computeRectFromParentRect(
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

export function buildSemanticTree(nodes: Map<string, RegisteredNode>): SolverNode {
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
        anchor_point: normalizedNode.anchorPoint,
        children: [],
        id: normalizedNode.id,
        node_type: normalizedNode.nodeType,
        position: normalizedNode.position,
        size: normalizedNode.size,
      };
    }

    stack.add(normalizedNode.id);
    const children = (byParentId.get(normalizedNode.id) ?? []).map((child) => buildNode(child));
    stack.delete(normalizedNode.id);

    return {
      Id: normalizedNode.id,
      anchor_point: normalizedNode.anchorPoint,
      children,
      id: normalizedNode.id,
      node_type: normalizedNode.nodeType,
      position: normalizedNode.position,
      size: normalizedNode.size,
    };
  };

  return {
    Id: SYNTHETIC_ROOT_ID,
    anchor_point: toSolverVector2(ZERO_VECTOR2),
    children: roots.map((root) => buildNode(root, true)),
    id: SYNTHETIC_ROOT_ID,
    node_type: "Frame",
    position: toSolverUDim2(ZERO_UDIM2),
    size: toSolverUDim2(FULL_SIZE_UDIM2),
  };
}
