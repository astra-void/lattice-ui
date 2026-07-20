export type FocusRestoreSnapshot = {
  nodeId?: number;
};

// Directional navigation intent, expressed in screen-space cardinal directions.
export type NavDirection = "up" | "down" | "left" | "right";

// How a scope resolves a directional move between the nodes it owns.
// - "ordered": step through nodes by registration order along the scope's
//   primary axis (roving); cross-axis directions escape to the parent scope.
// - "spatial": pick the nearest node in the pressed direction by geometry.
export type NavStrategy = "ordered" | "spatial";

// Primary axis for an ordered scope. "vertical" -> up/down step, "horizontal"
// -> left/right step. Cross-axis directions escape.
export type NavOrientation = "vertical" | "horizontal";

export type FocusNodeRecord = {
  id: number;
  scopeId?: number;
  implicit: boolean;
  order: number;
  getGuiObject: () => GuiObject | undefined;
  getDisabled: () => boolean;
  getVisible: () => boolean | undefined;
  getSyncToRoblox: () => boolean;
  // When true for a direction, the focused widget consumes that directional
  // input itself (text cursor, slider value) and the navigation controller
  // passes the input through instead of moving focus.
  getCapturesDirectional: (direction: NavDirection) => boolean;
  // Called when focus enters or leaves this node, so a widget can drive its own
  // highlight from the focus manager instead of the engine's selection events.
  onFocusChange: (focused: boolean) => void;
  // Runs the widget's activation (Enter/Space/ButtonA while focused). Returns
  // false when the node has no activation of its own, so the navigation
  // controller can pass the input through.
  activate: () => boolean;
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
  getNavStrategy: () => NavStrategy;
  getNavOrientation: () => NavOrientation;
  getNavWrap: () => boolean;
};

export type RegisterFocusNodeParams = {
  scopeId?: number;
  getGuiObject: () => GuiObject | undefined;
  getDisabled?: () => boolean;
  getVisible?: () => boolean | undefined;
  getSyncToRoblox?: () => boolean;
  getCapturesDirectional?: (direction: NavDirection) => boolean;
  onFocusChange?: (focused: boolean) => void;
  activate?: () => boolean;
};

export type RegisterFocusScopeParams = {
  parentScopeId?: number;
  getRoot: () => GuiObject | undefined;
  getActive: () => boolean;
  getTrapped: () => boolean;
  getRestoreFocus?: () => boolean;
  getLayerOrder?: () => number | undefined;
  getNavStrategy?: () => NavStrategy;
  getNavOrientation?: () => NavOrientation;
  getNavWrap?: () => boolean;
};

export type ResolvedFocusNode = {
  record: FocusNodeRecord;
  guiObject: GuiObject;
};

export type ResolveNodeOptions = {
  allowImplicit?: boolean;
  trapScopeOverride?: FocusScopeRecord;
};
