import { describe, expect, it } from "vitest";
import {
  getFirstEnabledRovingIndex,
  getLastEnabledRovingIndex,
  getNextRovingIndex,
} from "../../../packages/focus/src/RovingFocus/roving";

describe("Roving focus helpers", () => {
  it("returns -1 for next index when there are no items", () => {
    expect(getNextRovingIndex(0, 0, "next", false)).toBe(-1);
  });

  it("keeps the current index unchanged when current index is out of range", () => {
    expect(getNextRovingIndex(-3, 5, "next", true)).toBe(-3);
    expect(getNextRovingIndex(8, 5, "prev", true)).toBe(8);
  });

  it("does not move past ends when loop is disabled", () => {
    expect(getNextRovingIndex(0, 4, "prev", false)).toBe(0);
    expect(getNextRovingIndex(3, 4, "next", false)).toBe(3);
  });

  it("wraps when loop is enabled", () => {
    expect(getNextRovingIndex(3, 4, "next", true)).toBe(0);
    expect(getNextRovingIndex(0, 4, "prev", true)).toBe(3);
  });

  it("skips disabled items while moving", () => {
    const disabled = (index: number) => index === 2;
    expect(getNextRovingIndex(1, 5, "next", true, disabled)).toBe(3);
    expect(getNextRovingIndex(3, 5, "prev", true, disabled)).toBe(1);
  });

  it("returns current index when all items are disabled", () => {
    const disabled = () => true;
    expect(getNextRovingIndex(2, 5, "next", true, disabled)).toBe(2);
  });

  it("finds first enabled index or -1", () => {
    const disabled = (index: number) => index < 2;
    expect(getFirstEnabledRovingIndex(5, disabled)).toBe(2);
    expect(getFirstEnabledRovingIndex(3, () => true)).toBe(-1);
  });

  it("finds last enabled index or -1", () => {
    const disabled = (index: number) => index > 2;
    expect(getLastEnabledRovingIndex(5, disabled)).toBe(2);
    expect(getLastEnabledRovingIndex(3, () => true)).toBe(-1);
  });
});
