import { isInsideRoot } from "../guiObject";
import { resolveFocusNodeRecord } from "../resolution";
import { focusNodes } from "../state";
import { sortByTreeOrder } from "../treeOrder";
import type { ResolvedFocusNode, ResolveNodeOptions } from "../types";

// Collects every currently-resolvable focus node (visible, enabled, inside the
// active trap boundary), sorted by tree order (sibling LayoutOrder, registration
// order as the tiebreak; see treeOrder.ts). This is the candidate pool shared by
// ordered stepping, spatial resolution, and Tab traversal.
export function getResolvableNodes(options?: ResolveNodeOptions): Array<ResolvedFocusNode> {
  const resolved: Array<ResolvedFocusNode> = [];
  for (const record of focusNodes) {
    const node = resolveFocusNodeRecord(record, options);
    if (node) {
      resolved.push(node);
    }
  }

  return sortByTreeOrder(
    resolved,
    (node) => node.guiObject,
    (node) => node.record.order,
  );
}

// Narrows an already-collected pool to one scope root. Resolving a move walks
// the scope chain, so the pool is collected once and narrowed per scope rather
// than rebuilt from the registry at every step.
export function filterNodesInRoot(
  nodes: ReadonlyArray<ResolvedFocusNode>,
  root: GuiObject | undefined,
): Array<ResolvedFocusNode> {
  if (root === undefined) {
    return [];
  }

  return nodes.filter((node) => isInsideRoot(root, node.guiObject));
}
