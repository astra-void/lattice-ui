export function isLiveGuiObject(guiObject: GuiObject | undefined): guiObject is GuiObject {
  return guiObject !== undefined && guiObject.Parent !== undefined;
}

export function isEffectivelyVisible(guiObject: GuiObject | undefined) {
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

export function isInsideRoot(scopeRoot: GuiObject | undefined, guiObject: GuiObject | undefined) {
  if (!isLiveGuiObject(scopeRoot) || !isLiveGuiObject(guiObject)) {
    return false;
  }

  return guiObject === scopeRoot || guiObject.IsDescendantOf(scopeRoot);
}

export function isRawGuiObjectFocusable(guiObject: GuiObject | undefined) {
  return isLiveGuiObject(guiObject) && isEffectivelyVisible(guiObject) && guiObject.Selectable;
}

export function toSafeSelectedObject(guiObject: GuiObject | undefined) {
  return isRawGuiObjectFocusable(guiObject) ? guiObject : undefined;
}
