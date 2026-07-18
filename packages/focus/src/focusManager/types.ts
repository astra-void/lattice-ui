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

export type FocusScopeRecord = {
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

export type ResolvedFocusNode = {
  record: FocusNodeRecord;
  guiObject: GuiObject;
};

export type ResolveNodeOptions = {
  allowImplicit?: boolean;
  trapScopeOverride?: FocusScopeRecord;
};
