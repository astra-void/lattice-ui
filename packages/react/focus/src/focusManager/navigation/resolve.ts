import { getFocusedNode } from "../engine";
import { runResolutionPass } from "../pass";
import { getFocusScopeRecord } from "../registry";
import { getNodeOwningScopeId, getResolvedFocusNode, getTopTrappedScope } from "../resolution";
import { getBestScopeFallbackNode } from "../traversal";
import type { FocusScopeRecord, NavDirection, NavOrientation, ResolvedFocusNode } from "../types";
import { filterNodesInRoot, getResolvableNodes } from "./candidates";
import { findSpatialTarget } from "./spatial";

export type NavIntent = { type: "move"; direction: NavDirection } | { type: "next" } | { type: "prev" };

function isOnAxis(direction: NavDirection, orientation: NavOrientation) {
  if (orientation === "vertical") {
    return direction === "up" || direction === "down";
  }
  return direction === "left" || direction === "right";
}

// -1 steps toward the start of the ordered list (up/left), +1 toward the end.
function directionStep(direction: NavDirection): -1 | 1 {
  return direction === "up" || direction === "left" ? -1 : 1;
}

function getCurrentResolvedNode(): ResolvedFocusNode | undefined {
  const focused = getFocusedNode();
  if (!focused) {
    return undefined;
  }
  return getResolvedFocusNode(focused.id);
}

function getOwningScope(current: ResolvedFocusNode): FocusScopeRecord | undefined {
  const scopeId = getNodeOwningScopeId(current.record, current.guiObject);
  return getFocusScopeRecord(scopeId);
}

function stepOrdered(
  scope: FocusScopeRecord,
  nodes: Array<ResolvedFocusNode>,
  current: ResolvedFocusNode,
  step: -1 | 1,
): ResolvedFocusNode | undefined {
  if (nodes.size() === 0) {
    return undefined;
  }

  const currentIndex = nodes.findIndex((node) => node.record.id === current.record.id);
  if (currentIndex === -1) {
    return step > 0 ? nodes[0] : nodes[nodes.size() - 1];
  }

  let nextIndex = currentIndex + step;
  if (nextIndex < 0 || nextIndex >= nodes.size()) {
    if (!scope.getNavWrap()) {
      return undefined;
    }
    nextIndex = (nextIndex + nodes.size()) % nodes.size();
  }

  return nodes[nextIndex];
}

function resolveMove(current: ResolvedFocusNode, direction: NavDirection): ResolvedFocusNode | undefined {
  let scope = getOwningScope(current);

  // Every scope in the chain draws its candidates from the same trap boundary,
  // so the pool is collected once here and narrowed per scope below.
  const candidates = getResolvableNodes();

  // Walk up the scope chain: each scope gets a chance to resolve the move with
  // its own strategy; ordered scopes escape cross-axis moves to their parent,
  // and any scope that fails to find a target escapes upward — until a trapped
  // scope stops the walk.
  while (scope !== undefined) {
    const scopeNodes = filterNodesInRoot(candidates, scope.getRoot());

    if (scope.getNavStrategy() === "ordered" && isOnAxis(direction, scope.getNavOrientation())) {
      const target = stepOrdered(scope, scopeNodes, current, directionStep(direction));
      if (target) {
        return target;
      }
    } else {
      const target = findSpatialTarget(current, scopeNodes, direction);
      if (target) {
        return target;
      }
    }

    if (scope.getTrapped()) {
      return undefined;
    }

    scope = getFocusScopeRecord(scope.parentScopeId);
  }

  // No owning scope (or escaped past the outermost one): resolve spatially
  // across every focusable node within the active trap boundary.
  return findSpatialTarget(current, candidates, direction);
}

function resolveTab(current: ResolvedFocusNode | undefined, step: -1 | 1): ResolvedFocusNode | undefined {
  const nodes = getResolvableNodes();
  if (nodes.size() === 0) {
    return undefined;
  }

  const currentIndex = current !== undefined ? nodes.findIndex((node) => node.record.id === current.record.id) : -1;
  if (currentIndex === -1) {
    return step > 0 ? nodes[0] : nodes[nodes.size() - 1];
  }

  const nextIndex = (currentIndex + step + nodes.size()) % nodes.size();
  return nodes[nextIndex];
}

// Resolves a navigation intent to a target node, or undefined for a no-op.
// Returns undefined when the current node consumes the direction itself
// (caller should pass the input through instead of moving focus).
export function resolveNavigation(intent: NavIntent): ResolvedFocusNode | undefined {
  // Resolution reads the GUI tree and the registries but never mutates them, so
  // the whole intent is answered as one pass with shared lookup caches.
  return runResolutionPass(() => {
    const current = getCurrentResolvedNode();

    if (intent.type === "next" || intent.type === "prev") {
      return resolveTab(current, intent.type === "next" ? 1 : -1);
    }

    if (!current) {
      // Nothing focused inside our UI: seed focus at the top trapped scope's
      // preferred node, otherwise the first focusable node on screen.
      const trapped = getTopTrappedScope();
      if (trapped) {
        return getBestScopeFallbackNode(trapped);
      }
      return getResolvableNodes()[0];
    }

    return resolveMove(current, intent.direction);
  });
}

export function currentNodeCapturesDirectional(direction: NavDirection): boolean {
  const current = getCurrentResolvedNode();
  return current?.record.getCapturesDirectional(direction) === true;
}
