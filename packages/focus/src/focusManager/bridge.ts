import { GuiService } from "../env";
import { toSafeSelectedObject } from "./guiObject";
import { canSyncNodeToRoblox, getResolvedFocusNode } from "./resolution";
import { focusState } from "./state";

function setGuiServiceSelectedObject(guiObject: GuiObject | undefined) {
  GuiService.SelectedObject = toSafeSelectedObject(guiObject);
}

export function withBridgeWrite<T>(callback: () => T) {
  focusState.bridgeWriteDepth += 1;
  const result = callback();
  focusState.bridgeWriteDepth -= 1;
  return result;
}

export function syncRobloxSelection() {
  const resolvedFocusedNode =
    focusState.currentFocusedNodeId !== undefined
      ? getResolvedFocusNode(focusState.currentFocusedNodeId)
      : undefined;
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
