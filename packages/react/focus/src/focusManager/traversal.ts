import { isInsideRoot, isLiveGuiObject } from "./guiObject";
import { getResolvedFocusNode, resolveFocusNodeByGuiObject } from "./resolution";
import { focusNodes } from "./state";
import type { FocusScopeRecord } from "./types";

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

export function getBestScopeFallbackNode(scopeRecord: FocusScopeRecord) {
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
