import { syncRobloxSelection } from "./bridge";
import { isInsideRoot } from "./guiObject";
import { getResolvedFocusNode, getTopTrappedScope, resolveFocusNodeByGuiObject } from "./resolution";
import { focusNodes, focusScopes, focusState } from "./state";
import { getBestScopeFallbackNode } from "./traversal";

function updateScopeLastFocusedNode(nodeId: number, guiObject: GuiObject) {
  for (const scopeRecord of focusScopes) {
    if (!scopeRecord.getActive()) {
      continue;
    }

    if (isInsideRoot(scopeRecord.getRoot(), guiObject)) {
      scopeRecord.lastFocusedNodeId = nodeId;
    }
  }
}

export function setCurrentFocusedNode(nodeId: number | undefined) {
  focusState.currentFocusedNodeId = nodeId;
  const resolvedNode = nodeId !== undefined ? getResolvedFocusNode(nodeId) : undefined;
  if (resolvedNode) {
    updateScopeLastFocusedNode(resolvedNode.record.id, resolvedNode.guiObject);
  }

  syncRobloxSelection();
  return resolvedNode?.guiObject;
}

export function enforceTrappedFocus(excludingScopeId?: number) {
  const trappedScope = getTopTrappedScope(excludingScopeId);
  if (!trappedScope) {
    syncRobloxSelection();
    return;
  }

  const currentFocusedNode =
    focusState.currentFocusedNodeId !== undefined
      ? getResolvedFocusNode(focusState.currentFocusedNodeId, { trapScopeOverride: trappedScope })
      : undefined;
  if (currentFocusedNode) {
    syncRobloxSelection();
    return;
  }

  const fallbackNode = getBestScopeFallbackNode(trappedScope);
  if (fallbackNode) {
    setCurrentFocusedNode(fallbackNode.record.id);
    return;
  }

  setCurrentFocusedNode(undefined);
}

function isFocusNodeReferenced(nodeId: number) {
  if (focusState.currentFocusedNodeId === nodeId) {
    return true;
  }

  for (const scopeRecord of focusScopes) {
    if (scopeRecord.lastFocusedNodeId === nodeId || scopeRecord.restoreSnapshot?.nodeId === nodeId) {
      return true;
    }
  }

  return false;
}

export function pruneImplicitFocusNodes() {
  for (let index = focusNodes.size() - 1; index >= 0; index--) {
    const nodeRecord = focusNodes[index];
    if (!nodeRecord.implicit) {
      continue;
    }

    if (isFocusNodeReferenced(nodeRecord.id)) {
      continue;
    }

    focusNodes.remove(index);
  }
}

export function canFocusNode(nodeId: number) {
  return getResolvedFocusNode(nodeId) !== undefined;
}

export function focusNode(nodeId: number) {
  const resolvedNode = getResolvedFocusNode(nodeId);
  if (!resolvedNode) {
    return undefined;
  }

  return setCurrentFocusedNode(resolvedNode.record.id);
}

export function focusGuiObject(guiObject: GuiObject | undefined) {
  const resolvedNode = resolveFocusNodeByGuiObject(guiObject, {
    allowImplicit: true,
  });
  if (!resolvedNode) {
    return undefined;
  }

  return setCurrentFocusedNode(resolvedNode.record.id);
}

export function getFocusedNode() {
  if (focusState.currentFocusedNodeId === undefined) {
    return undefined;
  }

  const resolvedNode = getResolvedFocusNode(focusState.currentFocusedNodeId);
  return resolvedNode?.record;
}

export function getFocusedGuiObject() {
  const focusedNode = getFocusedNode();
  return focusedNode?.getGuiObject();
}
