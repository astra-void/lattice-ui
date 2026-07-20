import { syncRobloxSelection } from "./bridge";
import { isInsideRoot } from "./guiObject";
import { getFocusNodeRecord } from "./registry";
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

// Focus notifications are the widget-facing half of the engine: a node learns it
// gained or lost focus here rather than from Roblox's SelectionGained/Lost, so
// a widget's highlight follows managed focus even when the node never reaches
// GuiService.SelectedObject.
export function notifyFocusChange(previousNodeId: number | undefined, nextNodeId: number | undefined) {
  if (previousNodeId === nextNodeId) {
    return;
  }

  if (previousNodeId !== undefined) {
    getFocusNodeRecord(previousNodeId)?.onFocusChange(false);
  }

  if (nextNodeId !== undefined) {
    getFocusNodeRecord(nextNodeId)?.onFocusChange(true);
  }
}

export function setCurrentFocusedNode(nodeId: number | undefined) {
  const previousNodeId = focusState.currentFocusedNodeId;
  focusState.currentFocusedNodeId = nodeId;
  const resolvedNode = nodeId !== undefined ? getResolvedFocusNode(nodeId) : undefined;
  if (resolvedNode) {
    updateScopeLastFocusedNode(resolvedNode.record.id, resolvedNode.guiObject);
  }

  syncRobloxSelection();
  notifyFocusChange(previousNodeId, nodeId);
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

// Runs the focused node's own activation. Returns false when nothing is focused
// or the focused node has no activation, so callers can pass the input on.
export function activateFocusedNode() {
  return getFocusedNode()?.activate() === true;
}
