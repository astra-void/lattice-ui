const trappedScopeStack: number[] = [];

function findScopeIndex(scopeId: number) {
  return trappedScopeStack.indexOf(scopeId);
}

export function registerTrappedScope(scopeId: number) {
  if (findScopeIndex(scopeId) >= 0) {
    return;
  }

  trappedScopeStack.push(scopeId);
}

export function unregisterTrappedScope(scopeId: number) {
  const scopeIndex = findScopeIndex(scopeId);
  if (scopeIndex < 0) {
    return;
  }

  trappedScopeStack.remove(scopeIndex);
}

export function isTopTrappedScope(scopeId: number) {
  if (trappedScopeStack.size() <= 0) {
    return false;
  }

  const topScopeId = trappedScopeStack[trappedScopeStack.size() - 1];
  return topScopeId === scopeId;
}
