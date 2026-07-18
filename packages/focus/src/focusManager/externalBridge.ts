import { GuiService } from "../env";
import { enforceTrappedFocus, pruneImplicitFocusNodes, setCurrentFocusedNode } from "./engine";
import { resolveFocusNodeByGuiObject } from "./resolution";
import { focusState } from "./state";

function handleExternalSelectedObjectChange() {
  if (focusState.bridgeWriteDepth > 0) {
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
  if (focusState.selectedObjectConnection) {
    return;
  }

  focusState.selectedObjectConnection = GuiService.GetPropertyChangedSignal("SelectedObject").Connect(() => {
    handleExternalSelectedObjectChange();
  });
}

function stopExternalSelectionListener() {
  if (!focusState.selectedObjectConnection) {
    return;
  }

  focusState.selectedObjectConnection.Disconnect();
  focusState.selectedObjectConnection = undefined;
}

export function syncExternalSelectionListener() {
  if (focusState.externalSelectionConsumerCount > 0) {
    startExternalSelectionListener();
  } else {
    stopExternalSelectionListener();
  }
}
