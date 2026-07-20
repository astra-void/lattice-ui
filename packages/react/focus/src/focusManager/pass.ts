import type { FocusNodeRecord, FocusScopeRecord } from "./types";

// A resolution pass is one synchronous window in which focus is resolved but
// nothing is mutated: a directional move, a Tab step, a trap enforcement.
// Within it the GUI tree and the focus registries are constant, so the answers
// to "what are this node's ancestors", "which scope owns it" and "which scope
// currently traps" cannot change.
//
// Without that guarantee those answers get recomputed per node per scope per
// step of the scope chain, and each one walks the Roblox instance tree. Memoing
// them for the duration of the pass is what keeps a keypress linear in the
// number of focus nodes instead of quadratic.

export type GuiAncestry = {
  // Strict ancestors, so containment tests are a hash lookup rather than an
  // IsDescendantOf walk.
  ancestors: Set<Instance>;
  // Visibility folded into the same walk: an object is effectively visible only
  // when it and every ancestor GuiObject are visible and no ancestor
  // LayerCollector is disabled.
  effectivelyVisible: boolean;
};

// Scope ids start at 1, so 0 stands in for "no owning scope" — Luau maps treat
// a nil value as an absent key, so cached misses need a sentinel.
const NO_SCOPE_ID = 0;

const passState = {
  depth: 0,
  ancestry: new Map<GuiObject, GuiAncestry>(),
  owningScopeId: new Map<number, number>(),
  nodeByGuiObject: undefined as Map<GuiObject, FocusNodeRecord> | undefined,
  trappedScopeResolved: false,
  trappedScope: undefined as FocusScopeRecord | undefined,
};

function clearPassState() {
  passState.ancestry.clear();
  passState.owningScopeId.clear();
  passState.nodeByGuiObject = undefined;
  passState.trappedScopeResolved = false;
  passState.trappedScope = undefined;
}

// Runs `resolve` as a single pass. Nested calls share the outer pass's caches,
// so a fallback lookup inside a navigation resolve does not start over.
export function runResolutionPass<T>(resolve: () => T): T {
  passState.depth += 1;
  try {
    return resolve();
  } finally {
    passState.depth -= 1;
    if (passState.depth === 0) {
      clearPassState();
    }
  }
}

function computeAncestry(guiObject: GuiObject): GuiAncestry {
  const ancestors = new Set<Instance>();
  let effectivelyVisible = guiObject.Visible;

  let ancestor = guiObject.Parent;
  while (ancestor !== undefined) {
    ancestors.add(ancestor);

    if (effectivelyVisible) {
      if (ancestor.IsA("GuiObject") && !ancestor.Visible) {
        effectivelyVisible = false;
      } else if (ancestor.IsA("LayerCollector") && !ancestor.Enabled) {
        effectivelyVisible = false;
      }
    }

    ancestor = ancestor.Parent;
  }

  return { ancestors, effectivelyVisible };
}

// The caller must have established that `guiObject` is live.
export function getAncestry(guiObject: GuiObject): GuiAncestry {
  if (passState.depth === 0) {
    return computeAncestry(guiObject);
  }

  const cached = passState.ancestry.get(guiObject);
  if (cached) {
    return cached;
  }

  const computed = computeAncestry(guiObject);
  passState.ancestry.set(guiObject, computed);
  return computed;
}

// Ancestry that has already been paid for, if any. Containment tests use this
// to prefer the cached set but fall back to a plain IsDescendantOf outside a
// pass, where walking the whole chain to answer one question would be wasteful.
export function getCachedAncestry(guiObject: GuiObject): GuiAncestry | undefined {
  return passState.depth > 0 ? passState.ancestry.get(guiObject) : undefined;
}

export function getCachedOwningScopeId(nodeId: number): number | undefined {
  if (passState.depth === 0) {
    return undefined;
  }

  const cached = passState.owningScopeId.get(nodeId);
  if (cached === undefined || cached === NO_SCOPE_ID) {
    return undefined;
  }

  return cached;
}

export function hasCachedOwningScopeId(nodeId: number) {
  return passState.depth > 0 && passState.owningScopeId.has(nodeId);
}

export function setCachedOwningScopeId(nodeId: number, scopeId: number | undefined) {
  if (passState.depth > 0) {
    passState.owningScopeId.set(nodeId, scopeId ?? NO_SCOPE_ID);
  }
}

export function getCachedTrappedScope(): FocusScopeRecord | undefined {
  return passState.trappedScope;
}

export function hasCachedTrappedScope() {
  return passState.depth > 0 && passState.trappedScopeResolved;
}

export function setCachedTrappedScope(scope: FocusScopeRecord | undefined) {
  if (passState.depth > 0) {
    passState.trappedScopeResolved = true;
    passState.trappedScope = scope;
  }
}

// Index of the registered nodes by the GuiObject they front, built lazily
// because only descendant-walking fallbacks need it. Later registrations
// overwrite earlier ones so the index agrees with a reverse linear search.
export function getNodeIndexByGuiObject(nodeRecords: ReadonlyArray<FocusNodeRecord>) {
  if (passState.depth === 0) {
    return undefined;
  }

  const existing = passState.nodeByGuiObject;
  if (existing) {
    return existing;
  }

  const index = new Map<GuiObject, FocusNodeRecord>();
  for (const nodeRecord of nodeRecords) {
    const guiObject = nodeRecord.getGuiObject();
    if (guiObject !== undefined) {
      index.set(guiObject, nodeRecord);
    }
  }

  passState.nodeByGuiObject = index;
  return index;
}

// Keeps the lazy index honest when a pass registers an implicit node mid-flight.
export function indexNodeRecord(nodeRecord: FocusNodeRecord) {
  const index = passState.nodeByGuiObject;
  if (index === undefined) {
    return;
  }

  const guiObject = nodeRecord.getGuiObject();
  if (guiObject !== undefined) {
    index.set(guiObject, nodeRecord);
  }
}
