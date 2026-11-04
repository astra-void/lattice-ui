// Ordered navigation (ordered scopes, Tab, roving Tabs / RadioGroup items) has
// to follow the order the layout shows, not the order things mounted: an item
// that mounts later (shown conditionally, inserted in the middle, remounted by a
// key change) would otherwise sort to the end.
//
// Roblox has no document order to read. GetChildren reflects when each child was
// parented, which for a late mount is the same as mount order, so it cannot fix
// this either. What a UIListLayout / UIGridLayout actually sorts by is each
// sibling's LayoutOrder, or its Name under `SortOrder.Name`. Entries are
// therefore compared at the first ancestor level where their paths diverge, by
// that sibling key, and siblings that tie fall back to the earliest registration
// order inside each sibling's subtree. Ties are broken per subtree rather than
// per entry so the comparison stays a strict total order, which Luau's
// table.sort requires.

type TreeOrderEntry<T> = {
  entry: T;
  order: number;
  // Leaf first: the GuiObject itself, then each ancestor up to the root.
  path?: Array<Instance>;
};

function getInstancePath(guiObject: GuiObject) {
  const path: Instance[] = [];
  let current: Instance | undefined = guiObject;
  while (current !== undefined) {
    path.push(current);
    current = current.Parent;
  }

  return path;
}

function getLayoutOrder(instance: Instance) {
  return instance.IsA("GuiObject") ? instance.LayoutOrder : 0;
}

export function sortByTreeOrder<T extends defined>(
  entries: ReadonlyArray<T>,
  getGuiObject: (entry: T) => GuiObject | undefined,
  getOrder: (entry: T) => number,
): Array<T> {
  const keyed = entries.map((entry): TreeOrderEntry<T> => {
    const guiObject = getGuiObject(entry);
    return {
      entry,
      order: getOrder(entry),
      path: guiObject !== undefined && guiObject.Parent !== undefined ? getInstancePath(guiObject) : undefined,
    };
  });

  // Earliest registration order inside each instance's subtree. Sibling
  // subtrees are disjoint, so two tied siblings never share a value.
  const minOrderByInstance = new Map<Instance, number>();
  for (const item of keyed) {
    if (item.path === undefined) {
      continue;
    }

    for (const instance of item.path) {
      const existing = minOrderByInstance.get(instance);
      if (existing === undefined || item.order < existing) {
        minOrderByInstance.set(instance, item.order);
      }
    }
  }

  const sortsByNameByParent = new Map<Instance, boolean>();
  const sortsByName = (parent: Instance) => {
    const cached = sortsByNameByParent.get(parent);
    if (cached !== undefined) {
      return cached;
    }

    const layout = parent.FindFirstChildWhichIsA("UIGridStyleLayout");
    const result = layout !== undefined && layout.SortOrder === Enum.SortOrder.Name;
    sortsByNameByParent.set(parent, result);
    return result;
  };

  const precedes = (left: TreeOrderEntry<T>, right: TreeOrderEntry<T>) => {
    const leftPath = left.path;
    const rightPath = right.path;
    if (leftPath === undefined || rightPath === undefined) {
      // Entries without a mounted GuiObject go last, by registration order.
      if (leftPath !== rightPath) {
        return leftPath !== undefined;
      }
      return left.order < right.order;
    }

    let leftIndex = leftPath.size() - 1;
    let rightIndex = rightPath.size() - 1;
    while (leftIndex >= 0 && rightIndex >= 0 && leftPath[leftIndex] === rightPath[rightIndex]) {
      leftIndex -= 1;
      rightIndex -= 1;
    }

    if (leftIndex < 0 || rightIndex < 0) {
      // Same object, or one is an ancestor of the other (ancestor first).
      if (leftIndex === rightIndex) {
        return left.order < right.order;
      }
      return leftIndex < 0;
    }

    const leftSibling = leftPath[leftIndex];
    const rightSibling = rightPath[rightIndex];
    const parent = leftSibling.Parent;
    if (parent !== undefined && sortsByName(parent)) {
      if (leftSibling.Name !== rightSibling.Name) {
        return leftSibling.Name < rightSibling.Name;
      }
    } else {
      const leftLayoutOrder = getLayoutOrder(leftSibling);
      const rightLayoutOrder = getLayoutOrder(rightSibling);
      if (leftLayoutOrder !== rightLayoutOrder) {
        return leftLayoutOrder < rightLayoutOrder;
      }
    }

    return (minOrderByInstance.get(leftSibling) ?? 0) < (minOrderByInstance.get(rightSibling) ?? 0);
  };

  keyed.sort(precedes);
  return keyed.map((item) => item.entry);
}
