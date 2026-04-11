export const GuiService = game.GetService("GuiService");

export type FocusSnapshot = GuiObject | undefined;

export function captureFocus(): FocusSnapshot {
  return GuiService.SelectedObject;
}

function isLiveAndVisible(guiObject: GuiObject | undefined): guiObject is GuiObject {
  if (!guiObject || guiObject.Parent === undefined || !guiObject.Visible || !guiObject.Selectable) {
    return false;
  }

  let ancestor: Instance | undefined = guiObject.Parent;
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

export function restoreFocus(snapshot: FocusSnapshot) {
  const safeSnapshot = isLiveAndVisible(snapshot) ? snapshot : undefined;
  GuiService.SelectedObject = safeSnapshot;
}
