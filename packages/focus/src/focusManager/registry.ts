import { focusNodes, focusScopes } from "./state";

export function findFocusNodeIndex(nodeId: number) {
  return focusNodes.findIndex((entry) => entry.id === nodeId);
}

export function findFocusScopeIndex(scopeId: number) {
  return focusScopes.findIndex((entry) => entry.id === scopeId);
}

export function getFocusNodeRecord(nodeId: number | undefined) {
  if (nodeId === undefined) {
    return undefined;
  }

  const nodeIndex = findFocusNodeIndex(nodeId);
  if (nodeIndex < 0) {
    return undefined;
  }

  return focusNodes[nodeIndex];
}

export function getFocusScopeRecord(scopeId: number | undefined) {
  if (scopeId === undefined) {
    return undefined;
  }

  const scopeIndex = findFocusScopeIndex(scopeId);
  if (scopeIndex < 0) {
    return undefined;
  }

  return focusScopes[scopeIndex];
}
