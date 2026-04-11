import { GuiService } from "./env";

export type FocusRestoreSnapshot = {
  nodeId?: number;
};

export type FocusNodeRecord = {
  id: number;
  scopeId?: number;
  implicit: boolean;
  order: number;
  getGuiObject: () => GuiObject | undefined;
  getDisabled: () => boolean;
  getVisible: () => boolean | undefined;
  getSyncToRoblox: () => boolean;
};

type FocusScopeRecord = {
  id: number;
  parentScopeId?: number;
  order: number;
  wasActive: boolean;
  restoreSnapshot?: FocusRestoreSnapshot;
  restoreGuiObject?: GuiObject;
  lastFocusedNodeId?: number;
  getRoot: () => GuiObject | undefined;
  getActive: () => boolean;
  getTrapped: () => boolean;
  getRestoreFocus: () => boolean;
  getLayerOrder: () => number | undefined;
};

export type RegisterFocusNodeParams = {
  scopeId?: number;
  getGuiObject: () => GuiObject | undefined;
  getDisabled?: () => boolean;
  getVisible?: () => boolean | undefined;
  getSyncToRoblox?: () => boolean;
};

export type RegisterFocusScopeParams = {
  parentScopeId?: number;
  getRoot: () => GuiObject | undefined;
  getActive: () => boolean;
  getTrapped: () => boolean;
  getRestoreFocus?: () => boolean;
  getLayerOrder?: () => number | undefined;
};

type ResolvedFocusNode = {
  record: FocusNodeRecord;
  guiObject: GuiObject;
};

type ResolveNodeOptions = {
  allowImplicit?: boolean;
  trapScopeOverride?: FocusScopeRecord;
};

const focusNodes = new Array<FocusNodeRecord>();
const focusScopes = new Array<FocusScopeRecord>();

let nextFocusNodeId = 0;
let nextFocusScopeId = 0;
let nextFocusOrder = 0;
let currentFocusedNodeId: number | undefined;
let externalSelectionConsumerCount = 0;
let selectedObjectConnection: RBXScriptConnection | undefined;
let bridgeWriteDepth = 0;

function isLiveGuiObject(guiObject: GuiObject | undefined): guiObject is GuiObject {
  return guiObject !== undefined && guiObject.Parent !== undefined;
}

function isEffectivelyVisible(guiObject: GuiObject | undefined) {
  if (!isLiveGuiObject(guiObject) || !guiObject.Visible) {
    return false;
  }

  let ancestor = guiObject.Parent;
  while (ancestor !== undefined) {
    if (ancestor.IsA("GuiObject") && !ancestor.Visible) {
      return false;
    }

    if (ancestor.IsA("LayerCollector") && !ancestor.Enabled) {
      return false;
    }

    ancestor = ancestor.Parent;
  }

  return true;
}

function isInsideRoot(scopeRoot: GuiObject | undefined, guiObject: GuiObject | undefined) {
  if (!isLiveGuiObject(scopeRoot) || !isLiveGuiObject(guiObject)) {
    return false;
  }

  return guiObject === scopeRoot || guiObject.IsDescendantOf(scopeRoot);
}

function isRawGuiObjectFocusable(guiObject: GuiObject | undefined) {
  return isLiveGuiObject(guiObject) && isEffectivelyVisible(guiObject) && guiObject.Selectable;
}

function toSafeSelectedObject(guiObject: GuiObject | undefined) {
  return isRawGuiObjectFocusable(guiObject) ? guiObject : undefined;
}

function setGuiServiceSelectedObject(guiObject: GuiObject | undefined) {
  GuiService.SelectedObject = toSafeSelectedObject(guiObject);
}

function findFocusNodeIndex(nodeId: number) {
  return focusNodes.findIndex((entry) => entry.id === nodeId);
}

function findFocusScopeIndex(scopeId: number) {
  return focusScopes.findIndex((entry) => entry.id === scopeId);
}

function getFocusNodeRecord(nodeId: number | undefined) {
  if (nodeId === undefined) {
    return undefined;
  }

  const nodeIndex = findFocusNodeIndex(nodeId);
  if (nodeIndex < 0) {
    return undefined;
  }

  return focusNodes[nodeIndex];
}

function getFocusScopeRecord(scopeId: number | undefined) {
  if (scopeId === undefined) {
    return undefined;
  }

  const scopeIndex = findFocusScopeIndex(scopeId);
  if (scopeIndex < 0) {
    return undefined;
  }

  return focusScopes[scopeIndex];
}

function getNodeOwningScopeId(record: FocusNodeRecord, guiObject: GuiObject | undefined) {
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

function getTopTrappedScope(excludingScopeId?: number) {
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

function getResolvedFocusNode(nodeId: number, options?: ResolveNodeOptions) {
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

function canSyncNodeToRoblox(resolvedNode: ResolvedFocusNode) {
  return resolvedNode.record.getSyncToRoblox() && resolvedNode.guiObject.Selectable;
}

function withBridgeWrite<T>(callback: () => T) {
  bridgeWriteDepth += 1;
  const result = callback();
  bridgeWriteDepth -= 1;
  return result;
}

function syncRobloxSelection() {
  const resolvedFocusedNode =
    currentFocusedNodeId !== undefined ? getResolvedFocusNode(currentFocusedNodeId) : undefined;
  const nextSelectedObject = toSafeSelectedObject(
    resolvedFocusedNode && canSyncNodeToRoblox(resolvedFocusedNode) ? resolvedFocusedNode.guiObject : undefined,
  );
  if (GuiService.SelectedObject === nextSelectedObject) {
    return;
  }

  withBridgeWrite(() => {
    setGuiServiceSelectedObject(nextSelectedObject);
  });
}

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

function setCurrentFocusedNode(nodeId: number | undefined) {
  currentFocusedNodeId = nodeId;
  const resolvedNode = nodeId !== undefined ? getResolvedFocusNode(nodeId) : undefined;
  if (resolvedNode) {
    updateScopeLastFocusedNode(resolvedNode.record.id, resolvedNode.guiObject);
  }

  syncRobloxSelection();
  return resolvedNode?.guiObject;
}

function findExistingFocusNodeByGuiObject(guiObject: GuiObject | undefined) {
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

  nextFocusNodeId += 1;
  nextFocusOrder += 1;

  const nodeRecord: FocusNodeRecord = {
    id: nextFocusNodeId,
    scopeId: undefined,
    implicit: true,
    order: nextFocusOrder,
    getGuiObject: () => guiObject,
    getDisabled: () => false,
    getVisible: () => undefined,
    getSyncToRoblox: () => true,
  };

  focusNodes.push(nodeRecord);
  return nodeRecord;
}

function resolveFocusNodeByGuiObject(guiObject: GuiObject | undefined, options?: ResolveNodeOptions) {
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

function findFirstRegisteredNodeInScope(scopeRecord: FocusScopeRecord) {
  for (const nodeRecord of focusNodes) {
    const guiObject = nodeRecord.getGuiObject();
    if (!isInsideRoot(scopeRecord.getRoot(), guiObject)) {
      continue;
    }

    const resolvedNode = getResolvedFocusNode(nodeRecord.id, {
      trapScopeOverride: scopeRecord,
    });
    if (resolvedNode) {
      return resolvedNode;
    }
  }

  return undefined;
}

function findFirstFocusableDescendantInScope(scopeRecord: FocusScopeRecord) {
  const scopeRoot = scopeRecord.getRoot();
  if (!isLiveGuiObject(scopeRoot)) {
    return undefined;
  }

  const rootNode = resolveFocusNodeByGuiObject(scopeRoot, {
    allowImplicit: true,
    trapScopeOverride: scopeRecord,
  });
  if (rootNode) {
    return rootNode;
  }

  for (const descendant of scopeRoot.GetDescendants()) {
    if (!descendant.IsA("GuiObject")) {
      continue;
    }

    const resolvedNode = resolveFocusNodeByGuiObject(descendant, {
      allowImplicit: true,
      trapScopeOverride: scopeRecord,
    });
    if (resolvedNode) {
      return resolvedNode;
    }
  }

  return undefined;
}

function getBestScopeFallbackNode(scopeRecord: FocusScopeRecord) {
  const lastFocusedNodeId = scopeRecord.lastFocusedNodeId;
  if (lastFocusedNodeId !== undefined) {
    const lastFocusedNode = getResolvedFocusNode(lastFocusedNodeId, {
      trapScopeOverride: scopeRecord,
    });
    if (lastFocusedNode && isInsideRoot(scopeRecord.getRoot(), lastFocusedNode.guiObject)) {
      return lastFocusedNode;
    }
  }

  return findFirstFocusableDescendantInScope(scopeRecord) ?? findFirstRegisteredNodeInScope(scopeRecord);
}

function enforceTrappedFocus(excludingScopeId?: number) {
  const trappedScope = getTopTrappedScope(excludingScopeId);
  if (!trappedScope) {
    syncRobloxSelection();
    return;
  }

  const currentFocusedNode =
    currentFocusedNodeId !== undefined
      ? getResolvedFocusNode(currentFocusedNodeId, { trapScopeOverride: trappedScope })
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
  if (currentFocusedNodeId === nodeId) {
    return true;
  }

  for (const scopeRecord of focusScopes) {
    if (scopeRecord.lastFocusedNodeId === nodeId || scopeRecord.restoreSnapshot?.nodeId === nodeId) {
      return true;
    }
  }

  return false;
}

function pruneImplicitFocusNodes() {
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

function findBridgeRestoreNode() {
  const selectedObject = GuiService.SelectedObject;
  return resolveFocusNodeByGuiObject(selectedObject, {
    allowImplicit: true,
  });
}

function getCurrentFocusGuiObject() {
  const focusedNode = getFocusedNode();
  return focusedNode?.getGuiObject() ?? GuiService.SelectedObject;
}

function restoreScopeFocus(scopeRecord: FocusScopeRecord) {
  const snapshotNodeId = scopeRecord.restoreSnapshot?.nodeId;
  const restoreGuiObject = scopeRecord.restoreGuiObject;
  scopeRecord.restoreSnapshot = undefined;
  scopeRecord.restoreGuiObject = undefined;

  if (snapshotNodeId !== undefined) {
    const restoredGuiObject = focusNode(snapshotNodeId);
    if (restoredGuiObject) {
      return restoredGuiObject;
    }
  }

  if (restoreGuiObject) {
    const restoredGuiObject = focusGuiObject(restoreGuiObject);
    if (restoredGuiObject) {
      return restoredGuiObject;
    }
  }

  let ancestorScope = getFocusScopeRecord(scopeRecord.parentScopeId);
  while (ancestorScope) {
    const fallbackNode = getBestScopeFallbackNode(ancestorScope);
    if (fallbackNode) {
      const restoredGuiObject = focusNode(fallbackNode.record.id);
      if (restoredGuiObject) {
        return restoredGuiObject;
      }
    }

    ancestorScope = getFocusScopeRecord(ancestorScope.parentScopeId);
  }

  const topTrappedScope = getTopTrappedScope(scopeRecord.id);
  if (topTrappedScope) {
    const fallbackNode = getBestScopeFallbackNode(topTrappedScope);
    if (fallbackNode) {
      const restoredGuiObject = focusNode(fallbackNode.record.id);
      if (restoredGuiObject) {
        return restoredGuiObject;
      }
    }
  }

  setCurrentFocusedNode(undefined);
  return undefined;
}

function handleExternalSelectedObjectChange() {
  if (bridgeWriteDepth > 0) {
    return;
  }

  const selectedObject = GuiService.SelectedObject;
  const resolvedNode = resolveFocusNodeByGuiObject(selectedObject, {
    allowImplicit: true,
  });
  if (resolvedNode) {
    setCurrentFocusedNode(resolvedNode.record.id);
    pruneImplicitFocusNodes();
    return;
  }

  enforceTrappedFocus();
  pruneImplicitFocusNodes();
}

function startExternalSelectionListener() {
  if (selectedObjectConnection) {
    return;
  }

  selectedObjectConnection = GuiService.GetPropertyChangedSignal("SelectedObject").Connect(() => {
    handleExternalSelectedObjectChange();
  });
}

function stopExternalSelectionListener() {
  if (!selectedObjectConnection) {
    return;
  }

  selectedObjectConnection.Disconnect();
  selectedObjectConnection = undefined;
}

function syncExternalSelectionListener() {
  if (externalSelectionConsumerCount > 0) {
    startExternalSelectionListener();
  } else {
    stopExternalSelectionListener();
  }
}

export function registerFocusNode(params: RegisterFocusNodeParams) {
  nextFocusNodeId += 1;
  nextFocusOrder += 1;

  const nodeRecord: FocusNodeRecord = {
    id: nextFocusNodeId,
    scopeId: params.scopeId,
    implicit: false,
    order: nextFocusOrder,
    getGuiObject: params.getGuiObject,
    getDisabled: params.getDisabled ?? (() => false),
    getVisible: params.getVisible ?? (() => undefined),
    getSyncToRoblox: params.getSyncToRoblox ?? (() => true),
  };

  focusNodes.push(nodeRecord);

  const guiObject = nodeRecord.getGuiObject();
  const currentFocusedNode = currentFocusedNodeId !== undefined ? getFocusNodeRecord(currentFocusedNodeId) : undefined;
  if (currentFocusedNode?.implicit && currentFocusedNode.getGuiObject() === guiObject) {
    currentFocusedNodeId = nodeRecord.id;
    for (const scopeRecord of focusScopes) {
      if (scopeRecord.lastFocusedNodeId === currentFocusedNode.id) {
        scopeRecord.lastFocusedNodeId = nodeRecord.id;
      }
    }
  }
  enforceTrappedFocus();
  return nodeRecord.id;
}

export function createFocusScopeId() {
  nextFocusScopeId += 1;
  return nextFocusScopeId;
}

export function unregisterFocusNode(nodeId: number) {
  const nodeIndex = findFocusNodeIndex(nodeId);
  if (nodeIndex < 0) {
    return;
  }

  focusNodes.remove(nodeIndex);

  for (const scopeRecord of focusScopes) {
    if (scopeRecord.lastFocusedNodeId === nodeId) {
      scopeRecord.lastFocusedNodeId = undefined;
    }
  }

  if (currentFocusedNodeId === nodeId) {
    currentFocusedNodeId = undefined;
  }

  pruneImplicitFocusNodes();
  enforceTrappedFocus();
}

export function registerFocusScope(scopeId: number, params: RegisterFocusScopeParams) {
  nextFocusOrder += 1;

  const scopeRecord: FocusScopeRecord = {
    id: scopeId,
    parentScopeId: params.parentScopeId,
    order: nextFocusOrder,
    wasActive: false,
    getRoot: params.getRoot,
    getActive: params.getActive,
    getTrapped: params.getTrapped,
    getRestoreFocus: params.getRestoreFocus ?? (() => true),
    getLayerOrder: params.getLayerOrder ?? (() => undefined),
  };

  focusScopes.push(scopeRecord);
  syncFocusScope(scopeRecord.id);
  return scopeRecord.id;
}

export function syncFocusScope(scopeId: number) {
  const scopeRecord = getFocusScopeRecord(scopeId);
  if (!scopeRecord) {
    return;
  }

  const nextActive = scopeRecord.getActive();
  if (nextActive && !scopeRecord.wasActive) {
    scopeRecord.restoreSnapshot = scopeRecord.getRestoreFocus() ? captureRestoreSnapshot() : undefined;
    scopeRecord.restoreGuiObject = scopeRecord.getRestoreFocus() ? getCurrentFocusGuiObject() : undefined;
    scopeRecord.wasActive = true;
    if (scopeRecord.getTrapped()) {
      enforceTrappedFocus();
    }
  } else if (!nextActive && scopeRecord.wasActive) {
    scopeRecord.wasActive = false;
    const scopeIndex = findFocusScopeIndex(scopeId);
    if (scopeIndex >= 0) {
      focusScopes.remove(scopeIndex);
    }

    if (scopeRecord.getRestoreFocus()) {
      restoreScopeFocus(scopeRecord);
    } else {
      scopeRecord.restoreSnapshot = undefined;
      scopeRecord.restoreGuiObject = undefined;
      enforceTrappedFocus(scopeRecord.id);
    }

    focusScopes.push(scopeRecord);
  } else if (nextActive && scopeRecord.getTrapped()) {
    enforceTrappedFocus();
  }

  pruneImplicitFocusNodes();
}

export function unregisterFocusScope(scopeId: number) {
  const scopeIndex = findFocusScopeIndex(scopeId);
  if (scopeIndex < 0) {
    return;
  }

  const scopeRecord = focusScopes[scopeIndex];
  focusScopes.remove(scopeIndex);

  if (scopeRecord.wasActive && scopeRecord.getRestoreFocus()) {
    restoreScopeFocus(scopeRecord);
  } else {
    enforceTrappedFocus(scopeId);
  }

  pruneImplicitFocusNodes();
}

export function retainExternalFocusBridge() {
  externalSelectionConsumerCount += 1;
  syncExternalSelectionListener();
}

export function releaseExternalFocusBridge() {
  externalSelectionConsumerCount = math.max(0, externalSelectionConsumerCount - 1);
  syncExternalSelectionListener();
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

export function clearFocus() {
  setCurrentFocusedNode(undefined);
  enforceTrappedFocus();
}

export function getFocusedNode() {
  if (currentFocusedNodeId === undefined) {
    return undefined;
  }

  const resolvedNode = getResolvedFocusNode(currentFocusedNodeId);
  return resolvedNode?.record;
}

export function getFocusedGuiObject() {
  const focusedNode = getFocusedNode();
  return focusedNode?.getGuiObject();
}

export function captureRestoreSnapshot(): FocusRestoreSnapshot {
  const focusedNode = getFocusedNode();
  if (focusedNode) {
    return {
      nodeId: focusedNode.id,
    };
  }

  const bridgeNode = findBridgeRestoreNode();
  return {
    nodeId: bridgeNode?.record.id,
  };
}

export function restoreSnapshot(snapshot: FocusRestoreSnapshot | undefined) {
  const snapshotNodeId = snapshot?.nodeId;
  if (snapshotNodeId === undefined) {
    clearFocus();
    return undefined;
  }

  return focusNode(snapshotNodeId);
}
