import {
  enforceTrappedFocus,
  focusNode,
  pruneImplicitFocusNodes,
  setCurrentFocusedNode,
} from "./engine";
import { syncExternalSelectionListener } from "./externalBridge";
import { findFocusNodeIndex, findFocusScopeIndex, getFocusNodeRecord, getFocusScopeRecord } from "./registry";
import { captureRestoreSnapshot, getCurrentFocusGuiObject, restoreScopeFocus } from "./restore";
import { focusNodes, focusScopes, focusState } from "./state";
import type {
  FocusNodeRecord,
  FocusRestoreSnapshot,
  FocusScopeRecord,
  RegisterFocusNodeParams,
  RegisterFocusScopeParams,
} from "./types";

export type {
  FocusNodeRecord,
  FocusRestoreSnapshot,
  RegisterFocusNodeParams,
  RegisterFocusScopeParams,
} from "./types";
export { canFocusNode, focusGuiObject, focusNode, getFocusedGuiObject, getFocusedNode } from "./engine";
export { captureRestoreSnapshot } from "./restore";

export function registerFocusNode(params: RegisterFocusNodeParams) {
  focusState.nextFocusNodeId += 1;
  focusState.nextFocusOrder += 1;

  const nodeRecord: FocusNodeRecord = {
    id: focusState.nextFocusNodeId,
    scopeId: params.scopeId,
    implicit: false,
    order: focusState.nextFocusOrder,
    getGuiObject: params.getGuiObject,
    getDisabled: params.getDisabled ?? (() => false),
    getVisible: params.getVisible ?? (() => undefined),
    getSyncToRoblox: params.getSyncToRoblox ?? (() => true),
  };

  focusNodes.push(nodeRecord);

  const guiObject = nodeRecord.getGuiObject();
  const currentFocusedNode =
    focusState.currentFocusedNodeId !== undefined ? getFocusNodeRecord(focusState.currentFocusedNodeId) : undefined;
  if (currentFocusedNode?.implicit && currentFocusedNode.getGuiObject() === guiObject) {
    focusState.currentFocusedNodeId = nodeRecord.id;
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
  focusState.nextFocusScopeId += 1;
  return focusState.nextFocusScopeId;
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

  if (focusState.currentFocusedNodeId === nodeId) {
    focusState.currentFocusedNodeId = undefined;
  }

  pruneImplicitFocusNodes();
  enforceTrappedFocus();
}

export function registerFocusScope(scopeId: number, params: RegisterFocusScopeParams) {
  focusState.nextFocusOrder += 1;

  const scopeRecord: FocusScopeRecord = {
    id: scopeId,
    parentScopeId: params.parentScopeId,
    order: focusState.nextFocusOrder,
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
  focusState.externalSelectionConsumerCount += 1;
  syncExternalSelectionListener();
}

export function releaseExternalFocusBridge() {
  focusState.externalSelectionConsumerCount = math.max(0, focusState.externalSelectionConsumerCount - 1);
  syncExternalSelectionListener();
}

export function clearFocus() {
  setCurrentFocusedNode(undefined);
  enforceTrappedFocus();
}

export function restoreSnapshot(snapshot: FocusRestoreSnapshot | undefined) {
  const snapshotNodeId = snapshot?.nodeId;
  if (snapshotNodeId === undefined) {
    clearFocus();
    return undefined;
  }

  return focusNode(snapshotNodeId);
}
