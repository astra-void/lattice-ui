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

export type MeasuredNodeSize = {
  height: number;
  width: number;
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
  canMeasure?: boolean;
  id: string;
  measure?: () => MeasuredNodeSize | null;
  measurementVersion?: number;
  parentId?: string;
  nodeType: string;
  size?: SolverUDim2;
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

export type RobloxLayoutRegistrationInput = RobloxLayoutNodeInput & {
  canMeasure?: boolean;
  measure?: () => MeasuredNodeSize | null;
  measurementVersion?: number;
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

export function adaptRobloxNodeInput(input: RobloxLayoutRegistrationInput, parentId: string | undefined): RegisteredNode {
  return {
    anchorPoint: toSolverVector2(serializeVector2(input.anchorPoint, ZERO_VECTOR2)),
    canMeasure: input.canMeasure,
    id: normalizePreviewNodeId(input.id) ?? input.id,
    measure: input.measure,
    measurementVersion: input.measurementVersion,
    nodeType: input.nodeType,
    parentId: normalizePreviewNodeId(parentId),
    position: toSolverUDim2(serializeUDim2(input.position, ZERO_UDIM2) ?? ZERO_UDIM2),
    size: input.size ? toSolverUDim2(serializeUDim2(input.size, ZERO_UDIM2) ?? ZERO_UDIM2) : undefined,
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
    a.canMeasure === b.canMeasure &&
    a.id === b.id &&
    a.parentId === b.parentId &&
    a.nodeType === b.nodeType &&
    (a.measurementVersion ?? 0) === (b.measurementVersion ?? 0) &&
    (a.size?.x.scale ?? 0) === (b.size?.x.scale ?? 0) &&
    (a.size?.x.offset ?? 0) === (b.size?.x.offset ?? 0) &&
    (a.size?.y.scale ?? 0) === (b.size?.y.scale ?? 0) &&
    (a.size?.y.offset ?? 0) === (b.size?.y.offset ?? 0) &&
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
  const nodeSize = node.size ?? toSolverUDim2(ZERO_UDIM2);
  const width = resolveAxis(nodeSize.x, parentRect.width);
  const height = resolveAxis(nodeSize.y, parentRect.height);

  return {
    height,
    width,
    x: parentRect.x + resolveAxis(node.position.x, parentRect.width) - node.anchorPoint.x * width,
    y: parentRect.y + resolveAxis(node.position.y, parentRect.height) - node.anchorPoint.y * height,
  };
}
