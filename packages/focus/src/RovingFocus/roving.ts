import type { RovingDirection } from "./types";

function normalizeIndex(index: number, itemCount: number, direction: RovingDirection, loop: boolean) {
  if (itemCount <= 0) {
    return -1;
  }

  if (index >= 0 && index < itemCount) {
    return index;
  }

  if (!loop) {
    return direction === "next" ? -1 : itemCount;
  }

  return direction === "next" ? itemCount - 1 : 0;
}

function getDirectionDelta(direction: RovingDirection) {
  return direction === "next" ? 1 : -1;
}

export function getNextRovingIndex(
  currentIndex: number,
  itemCount: number,
  direction: RovingDirection,
  loop: boolean,
  isDisabled?: (index: number) => boolean,
) {
  if (itemCount <= 0) {
    return -1;
  }

  const start = normalizeIndex(currentIndex, itemCount, direction, loop);
  if (start === -1 || start === itemCount) {
    return direction === "next"
      ? getFirstEnabledRovingIndex(itemCount, isDisabled)
      : getLastEnabledRovingIndex(itemCount, isDisabled);
  }

  const delta = getDirectionDelta(direction);
  let candidate = start;

  for (let attempts = 0; attempts < itemCount; attempts++) {
    candidate += delta;

    if (candidate < 0 || candidate >= itemCount) {
      if (!loop) {
        return currentIndex;
      }
      candidate = direction === "next" ? 0 : itemCount - 1;
    }

    if (!isDisabled || !isDisabled(candidate)) {
      return candidate;
    }
  }

  return currentIndex;
}

export function getFirstEnabledRovingIndex(itemCount: number, isDisabled?: (index: number) => boolean) {
  for (let index = 0; index < itemCount; index++) {
    if (!isDisabled || !isDisabled(index)) {
      return index;
    }
  }

  return -1;
}

export function getLastEnabledRovingIndex(itemCount: number, isDisabled?: (index: number) => boolean) {
  for (let index = itemCount - 1; index >= 0; index--) {
    if (!isDisabled || !isDisabled(index)) {
      return index;
    }
  }

  return -1;
}
