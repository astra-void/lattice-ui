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
  externalSelectionConsumerCount: 0,
  selectedObjectConnection: undefined as RBXScriptConnection | undefined,
  bridgeWriteDepth: 0,
};
