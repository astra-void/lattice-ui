import { GuiService } from "../env";
import { focusGuiObject, focusNode, getFocusedNode, setCurrentFocusedNode } from "./engine";
import { getFocusScopeRecord } from "./registry";
import { getTopTrappedScope, resolveFocusNodeByGuiObject } from "./resolution";
import { getBestScopeFallbackNode } from "./traversal";
import type { FocusRestoreSnapshot, FocusScopeRecord } from "./types";

function findBridgeRestoreNode() {
  const selectedObject = GuiService.SelectedObject;
  return resolveFocusNodeByGuiObject(selectedObject, {
    allowImplicit: true,
  });
}

export function getCurrentFocusGuiObject() {
  const focusedNode = getFocusedNode();
  return focusedNode?.getGuiObject() ?? GuiService.SelectedObject;
}

export function restoreScopeFocus(scopeRecord: FocusScopeRecord) {
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
