import type React from "@rbxts/react";
import { focusGuiObject as focusManagedGuiObject, getFocusedGuiObject } from "./focus/focusManager";

export type OrderedSelectionDirection = -1 | 1;

export type OrderedSelectionEntry = {
  id: number;
  order: number;
  ref: React.MutableRefObject<GuiObject | undefined>;
  getDisabled?: () => boolean;
  getVisible?: () => boolean;
};

function isEntryVisible(entry: OrderedSelectionEntry) {
  const target = entry.ref.current;
  if (!target) {
    return false;
  }

  if (entry.getVisible && !entry.getVisible()) {
    return false;
  }

  return target.Visible;
}

export function getOrderedSelectionEntries<T extends OrderedSelectionEntry>(entries: Array<T>) {
  const ordered = [...entries];
  ordered.sort((left, right) => left.order < right.order);
  return ordered;
}

export function isOrderedSelectionEntryAvailable(entry: OrderedSelectionEntry) {
  const target = entry.ref.current;
  if (!target) {
    return false;
  }

  if (entry.getDisabled?.() === true) {
    return false;
  }

  if (!isEntryVisible(entry)) {
    return false;
  }

  return target.Selectable;
}

export function findOrderedSelectionEntry<T extends OrderedSelectionEntry>(
  entries: Array<T>,
  predicate: (entry: T) => boolean,
) {
  return getOrderedSelectionEntries(entries).find(
    (entry) => predicate(entry) && isOrderedSelectionEntryAvailable(entry),
  );
}

export function getCurrentOrderedSelectionEntry<T extends OrderedSelectionEntry>(entries: Array<T>) {
  const current = getFocusedGuiObject();
  if (!current) {
    return undefined;
  }

  return getOrderedSelectionEntries(entries).find(
    (entry) => entry.ref.current === current && isOrderedSelectionEntryAvailable(entry),
  );
}

export function getFirstOrderedSelectionEntry<T extends OrderedSelectionEntry>(entries: Array<T>) {
  return getOrderedSelectionEntries(entries).find(isOrderedSelectionEntryAvailable);
}

export function getRelativeOrderedSelectionEntry<T extends OrderedSelectionEntry>(
  entries: Array<T>,
  currentId: number | undefined,
  direction: OrderedSelectionDirection,
) {
  const selectableEntries = getOrderedSelectionEntries(entries).filter(isOrderedSelectionEntryAvailable);
  if (selectableEntries.size() === 0) {
    return undefined;
  }

  const currentIndex = currentId !== undefined ? selectableEntries.findIndex((entry) => entry.id === currentId) : -1;
  if (currentIndex === -1) {
    return direction > 0 ? selectableEntries[0] : selectableEntries[selectableEntries.size() - 1];
  }

  const nextIndex = math.clamp(currentIndex + direction, 0, selectableEntries.size() - 1);
  return selectableEntries[nextIndex];
}

export function focusOrderedSelectionEntry(entry: OrderedSelectionEntry | undefined) {
  return focusManagedGuiObject(entry?.ref.current);
}
