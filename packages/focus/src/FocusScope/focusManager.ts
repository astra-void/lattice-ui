export const GuiService = game.GetService("GuiService");

export type FocusSnapshot = GuiObject | undefined;

export function captureFocus(): FocusSnapshot {
  return GuiService.SelectedObject;
}

export function restoreFocus(snapshot: FocusSnapshot) {
  GuiService.SelectedObject = snapshot;
}
