import { getAncestry, getCachedAncestry } from "./pass";

export function isLiveGuiObject(guiObject: GuiObject | undefined): guiObject is GuiObject {
  return guiObject !== undefined && guiObject.Parent !== undefined;
}

export function isEffectivelyVisible(guiObject: GuiObject | undefined) {
  if (!isLiveGuiObject(guiObject) || !guiObject.Visible) {
    return false;
  }

  return getAncestry(guiObject).effectivelyVisible;
}

export function isInsideRoot(scopeRoot: GuiObject | undefined, guiObject: GuiObject | undefined) {
  if (!isLiveGuiObject(scopeRoot) || !isLiveGuiObject(guiObject)) {
    return false;
  }

  if (guiObject === scopeRoot) {
    return true;
  }

  // Inside a pass the node's ancestry has almost always been walked already for
  // its visibility check, which turns this into a hash lookup.
  const ancestry = getCachedAncestry(guiObject);
  return ancestry !== undefined ? ancestry.ancestors.has(scopeRoot) : guiObject.IsDescendantOf(scopeRoot);
}

export function isRawGuiObjectFocusable(guiObject: GuiObject | undefined) {
  return isLiveGuiObject(guiObject) && isEffectivelyVisible(guiObject) && guiObject.Selectable;
}

export function toSafeSelectedObject(guiObject: GuiObject | undefined) {
  return isRawGuiObjectFocusable(guiObject) ? guiObject : undefined;
}
