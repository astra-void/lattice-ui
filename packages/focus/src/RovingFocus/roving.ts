import type { RovingDirection } from "./types";

export function getNextRovingIndex(currentIndex: number, itemCount: number, direction: RovingDirection, loop: boolean) {
  if (itemCount <= 0) {
    return -1;
  }

  const delta = direction === "next" ? 1 : -1;
  const candidate = currentIndex + delta;

  if (candidate >= 0 && candidate < itemCount) {
    return candidate;
  }

  if (!loop) {
    return currentIndex;
  }

  return direction === "next" ? 0 : itemCount - 1;
}
