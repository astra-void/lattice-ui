import { isInsideRoot } from "../guiObject";
import { getResolvedFocusNode } from "../resolution";
import { focusNodes } from "../state";
import type { ResolvedFocusNode, ResolveNodeOptions } from "../types";

// Collects every currently-resolvable focus node (visible, enabled, inside the
// active trap boundary), sorted by registration order. This is the candidate
// pool shared by ordered stepping, spatial resolution, and Tab traversal.
export function getResolvableNodes(options?: ResolveNodeOptions): Array<ResolvedFocusNode> {
  const resolved: Array<ResolvedFocusNode> = [];
  for (const record of focusNodes) {
    const node = getResolvedFocusNode(record.id, options);
    if (node) {
      resolved.push(node);
    }
  }

  resolved.sort((left, right) => left.record.order < right.record.order);
  return resolved;
}

// Same as getResolvableNodes but restricted to nodes inside a scope root.
export function getResolvableNodesInRoot(
  root: GuiObject | undefined,
  options?: ResolveNodeOptions,
): Array<ResolvedFocusNode> {
  if (root === undefined) {
    return [];
  }

  return getResolvableNodes(options).filter((node) => isInsideRoot(root, node.guiObject));
}
