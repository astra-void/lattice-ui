import { isEffectivelyVisible, isInsideRoot, isLiveGuiObject, isRawGuiObjectFocusable } from "./guiObject";
import { getFocusNodeRecord, getFocusScopeRecord } from "./registry";
import { focusNodes, focusScopes, focusState } from "./state";
import type { FocusNodeRecord, FocusScopeRecord, ResolvedFocusNode, ResolveNodeOptions } from "./types";

export function getNodeOwningScopeId(record: FocusNodeRecord, guiObject: GuiObject | undefined) {
  if (record.scopeId !== undefined) {
    return record.scopeId;
  }

  if (!isLiveGuiObject(guiObject)) {
    return undefined;
  }

  let bestScopeId: number | undefined;
  let bestLayerOrder = -1;
  let bestScopeOrder = -1;

  for (const scopeRecord of focusScopes) {
    const scopeRoot = scopeRecord.getRoot();
    if (!isInsideRoot(scopeRoot, guiObject)) {
      continue;
    }

    const layerOrder = scopeRecord.getLayerOrder() ?? 0;
    if (layerOrder > bestLayerOrder || (layerOrder === bestLayerOrder && scopeRecord.order > bestScopeOrder)) {
      bestScopeId = scopeRecord.id;
      bestLayerOrder = layerOrder;
      bestScopeOrder = scopeRecord.order;
    }
  }

  return bestScopeId;
}

function isNodeInsideInactiveScope(record: FocusNodeRecord, guiObject: GuiObject) {
  const owningScopeId = getNodeOwningScopeId(record, guiObject);
  const owningScope = getFocusScopeRecord(owningScopeId);
  return owningScope !== undefined && !owningScope.getActive();
}

export function getTopTrappedScope(excludingScopeId?: number) {
  let bestScope: FocusScopeRecord | undefined;

  for (const scopeRecord of focusScopes) {
    if (scopeRecord.id === excludingScopeId || !scopeRecord.getActive() || !scopeRecord.getTrapped()) {
      continue;
    }

    const scopeRoot = scopeRecord.getRoot();
    if (!isLiveGuiObject(scopeRoot)) {
      continue;
    }

    if (!bestScope) {
      bestScope = scopeRecord;
      continue;
    }

    const bestLayerOrder = bestScope.getLayerOrder() ?? 0;
    const nextLayerOrder = scopeRecord.getLayerOrder() ?? 0;
    if (nextLayerOrder > bestLayerOrder || (nextLayerOrder === bestLayerOrder && scopeRecord.order > bestScope.order)) {
      bestScope = scopeRecord;
    }
  }

  return bestScope;
}

export function getResolvedFocusNode(nodeId: number, options?: ResolveNodeOptions) {
  const record = getFocusNodeRecord(nodeId);
  if (!record) {
    return undefined;
  }

  const guiObject = record.getGuiObject();
  if (!isLiveGuiObject(guiObject)) {
    return undefined;
  }

  if (record.getDisabled()) {
    return undefined;
  }

  const explicitVisible = record.getVisible();
  if (explicitVisible === false || !isEffectivelyVisible(guiObject)) {
    return undefined;
  }

  if (isNodeInsideInactiveScope(record, guiObject)) {
    return undefined;
  }

  const trappedScope = options?.trapScopeOverride ?? getTopTrappedScope();
  if (trappedScope && !isInsideRoot(trappedScope.getRoot(), guiObject)) {
    return undefined;
  }

  return {
    record,
    guiObject,
  };
}

export function canSyncNodeToRoblox(resolvedNode: ResolvedFocusNode) {
  return resolvedNode.record.getSyncToRoblox() && resolvedNode.guiObject.Selectable;
}

export function findExistingFocusNodeByGuiObject(guiObject: GuiObject | undefined) {
  if (!isLiveGuiObject(guiObject)) {
    return undefined;
  }

  for (let index = focusNodes.size() - 1; index >= 0; index--) {
    const nodeRecord = focusNodes[index];
    if (nodeRecord.getGuiObject() === guiObject) {
      return nodeRecord;
    }
  }

  return undefined;
}

function registerImplicitFocusNode(guiObject: GuiObject) {
  const existingNode = findExistingFocusNodeByGuiObject(guiObject);
  if (existingNode) {
    return existingNode;
  }

  focusState.nextFocusNodeId += 1;
  focusState.nextFocusOrder += 1;

  const nodeRecord: FocusNodeRecord = {
    id: focusState.nextFocusNodeId,
    scopeId: undefined,
    implicit: true,
    order: focusState.nextFocusOrder,
    getGuiObject: () => guiObject,
    getDisabled: () => false,
    getVisible: () => undefined,
    getSyncToRoblox: () => true,
    getCapturesDirectional: () => false,
  };

  focusNodes.push(nodeRecord);
  return nodeRecord;
}

export function resolveFocusNodeByGuiObject(guiObject: GuiObject | undefined, options?: ResolveNodeOptions) {
  if (!isLiveGuiObject(guiObject)) {
    return undefined;
  }

  const existingNode = findExistingFocusNodeByGuiObject(guiObject);
  if (existingNode) {
    return getResolvedFocusNode(existingNode.id, options);
  }

  if (!options?.allowImplicit || !isRawGuiObjectFocusable(guiObject)) {
    return undefined;
  }

  const implicitNode = registerImplicitFocusNode(guiObject);
  return getResolvedFocusNode(implicitNode.id, options);
}
