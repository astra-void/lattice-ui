import type { FocusNodeRecord, FocusScopeRecord } from "./types";

export const focusNodes: FocusNodeRecord[] = [];
export const focusScopes: FocusScopeRecord[] = [];

// Mutable scalar state grouped in a single object so that sibling modules can
// reassign fields across module boundaries (ESM forbids reassigning imported
// bindings, but mutating a shared object's fields is allowed).
export const focusState = {
  nextFocusNodeId: 0,
  nextFocusScopeId: 0,
  nextFocusOrder: 0,
  currentFocusedNodeId: undefined as number | undefined,
  // Number of active FocusScopes; the navigation controller binds input only
  // while this is > 0 so game controls keep working when no UI is active.
  navigationConsumerCount: 0,
  bridgeWriteDepth: 0,
};
