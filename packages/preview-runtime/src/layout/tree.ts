import {
  FULL_SIZE_UDIM2,
  serializeUDim2,
  serializeVector2,
  ZERO_UDIM2,
  ZERO_VECTOR2,
} from "../internal/robloxValues";
import {
  computeRectFromParentRect,
  createViewportRect,
  normalizeRootScreenGuiNode,
  SYNTHETIC_ROOT_ID,
  type ComputedRect,
  type MeasuredNodeSize,
  type RegisteredNode,
  type SolverNode,
} from "./model";

type LayoutTreeRecord = {
  childIds: string[];
  node: RegisteredNode;
};

export type LayoutTreeState = {
  nodes: Map<string, LayoutTreeRecord>;
  rootIds: string[];
};

function compareIds(left: string, right: string) {
  return left.localeCompare(right);
}

function cloneRecord(record: LayoutTreeRecord | undefined, node: RegisteredNode): LayoutTreeRecord {
  return {
    childIds: [...(record?.childIds ?? [])],
    node,
  };
}

function toSolverUDim2(
  value = serializeUDim2(ZERO_UDIM2, ZERO_UDIM2) ?? ZERO_UDIM2,
): NonNullable<RegisteredNode["size"]> {
  return {
    x: {
      offset: value.X.Offset,
      scale: value.X.Scale,
    },
    y: {
      offset: value.Y.Offset,
      scale: value.Y.Scale,
    },
  };
}

function toSolverVector2(value = serializeVector2(ZERO_VECTOR2, ZERO_VECTOR2) ?? ZERO_VECTOR2) {
  return {
    x: value.X,
    y: value.Y,
  };
}

function createMeasuredNodeSize(measuredSize: MeasuredNodeSize): NonNullable<RegisteredNode["size"]> {
  return {
    x: {
      offset: Math.max(0, measuredSize.width),
      scale: 0,
    },
    y: {
      offset: Math.max(0, measuredSize.height),
      scale: 0,
    },
  };
}

function resolveNodeSize(node: RegisteredNode, isRoot: boolean) {
  if (isRoot && node.nodeType === "ScreenGui") {
    return toSolverUDim2(FULL_SIZE_UDIM2);
  }

  if (node.size) {
    return node.size;
  }

  const measuredSize = node.canMeasure ? node.measure?.() : null;
  if (measuredSize) {
    return createMeasuredNodeSize(measuredSize);
  }

  return toSolverUDim2(ZERO_UDIM2);
}

function attachChild(records: Map<string, LayoutTreeRecord>, parentId: string, childId: string) {
  const parentRecord = records.get(parentId);
  if (!parentRecord || parentRecord.childIds.includes(childId)) {
    return;
  }

  parentRecord.childIds = [...parentRecord.childIds, childId].sort(compareIds);
}

function detachChild(records: Map<string, LayoutTreeRecord>, parentId: string, childId: string) {
  const parentRecord = records.get(parentId);
  if (!parentRecord || !parentRecord.childIds.includes(childId)) {
    return;
  }

  parentRecord.childIds = parentRecord.childIds.filter((candidate) => candidate !== childId);
}

function rebuildRoots(records: Map<string, LayoutTreeRecord>) {
  return [...records.values()]
    .filter((record) => !record.node.parentId || !records.has(record.node.parentId))
    .map((record) => record.node.id)
    .sort(compareIds);
}

export function createLayoutTreeState(): LayoutTreeState {
  return {
    nodes: new Map(),
    rootIds: [],
  };
}

export function upsertLayoutTreeNode(state: LayoutTreeState, node: RegisteredNode): LayoutTreeState {
  const records = new Map(state.nodes);
  const previousRecord = records.get(node.id);
  const nextRecord = cloneRecord(previousRecord, node);
  records.set(node.id, nextRecord);

  if (previousRecord?.node.parentId && previousRecord.node.parentId !== node.parentId) {
    detachChild(records, previousRecord.node.parentId, node.id);
  }

  if (node.parentId && records.has(node.parentId)) {
    attachChild(records, node.parentId, node.id);
  }

  for (const [recordId, record] of records.entries()) {
    if (recordId === node.id) {
      continue;
    }

    if (record.node.parentId === node.id) {
      attachChild(records, node.id, recordId);
    }
  }

  return {
    nodes: records,
    rootIds: rebuildRoots(records),
  };
}

export function removeLayoutTreeNode(state: LayoutTreeState, nodeId: string): LayoutTreeState {
  if (!state.nodes.has(nodeId)) {
    return state;
  }

  const records = new Map(state.nodes);
  const removedRecord = records.get(nodeId);
  records.delete(nodeId);

  if (removedRecord?.node.parentId) {
    detachChild(records, removedRecord.node.parentId, nodeId);
  }

  for (const record of records.values()) {
    if (record.node.parentId === nodeId) {
      record.childIds = record.childIds.filter((childId) => childId !== nodeId);
    }
  }

  return {
    nodes: records,
    rootIds: rebuildRoots(records),
  };
}

function buildSerializedNode(state: LayoutTreeState, nodeId: string, stack = new Set<string>(), isRoot = false): SolverNode {
  const record = state.nodes.get(nodeId);
  if (!record) {
    return {
      Id: nodeId,
      anchor_point: toSolverVector2(),
      children: [],
      id: nodeId,
      node_type: "Frame",
      position: toSolverUDim2(ZERO_UDIM2),
      size: toSolverUDim2(ZERO_UDIM2),
    };
  }

  const normalizedNode = isRoot ? normalizeRootScreenGuiNode(record.node) : record.node;
  if (stack.has(nodeId)) {
    return {
      Id: normalizedNode.id,
      anchor_point: normalizedNode.anchorPoint,
      children: [],
      id: normalizedNode.id,
      node_type: normalizedNode.nodeType,
      position: normalizedNode.position,
      size: resolveNodeSize(normalizedNode, isRoot),
    };
  }

  stack.add(nodeId);
  const children = record.childIds.map((childId) => buildSerializedNode(state, childId, stack));
  stack.delete(nodeId);

  return {
    Id: normalizedNode.id,
    anchor_point: normalizedNode.anchorPoint,
    children,
    id: normalizedNode.id,
    node_type: normalizedNode.nodeType,
    position: normalizedNode.position,
    size: resolveNodeSize(normalizedNode, isRoot),
  };
}

export function serializeLayoutTree(state: LayoutTreeState): SolverNode {
  return {
    Id: SYNTHETIC_ROOT_ID,
    anchor_point: toSolverVector2(ZERO_VECTOR2),
    children: state.rootIds.map((rootId) => buildSerializedNode(state, rootId, new Set<string>(), true)),
    id: SYNTHETIC_ROOT_ID,
    node_type: "Frame",
    position: toSolverUDim2(ZERO_UDIM2),
    size: toSolverUDim2(FULL_SIZE_UDIM2),
  };
}

function computeLayoutRecursive(node: SolverNode, parentRect: ComputedRect, output: Record<string, ComputedRect>) {
  const computedRect = computeRectFromParentRect(
    {
      anchorPoint: node.anchor_point,
      position: node.position,
      size: node.size,
    },
    parentRect,
  );
  output[node.id] = computedRect;

  for (const child of node.children) {
    computeLayoutRecursive(child, computedRect, output);
  }
}

export function computeSerializedTreeLayout(
  serializedTree: SolverNode,
  viewportWidth: number,
  viewportHeight: number,
): Record<string, ComputedRect> {
  const output: Record<string, ComputedRect> = {};
  const viewportRect = createViewportRect(viewportWidth, viewportHeight);
  computeLayoutRecursive(serializedTree, viewportRect, output);
  delete output[SYNTHETIC_ROOT_ID];
  return output;
}

export function computeTreeLayout(state: LayoutTreeState, viewportWidth: number, viewportHeight: number) {
  return computeSerializedTreeLayout(serializeLayoutTree(state), viewportWidth, viewportHeight);
}
