import { describe, expect, it } from "vitest";
import {
  clampProgressValue,
  INDETERMINATE_PROGRESS_RATIO,
  resolveProgressMax,
  resolveProgressRatio,
} from "../../../packages/react/progress/src/Progress/math";

describe("progress math", () => {
  it("clamps value within [0, max]", () => {
    expect(clampProgressValue(-10, 100)).toBe(0);
    expect(clampProgressValue(120, 100)).toBe(100);
  });

  it("computes ratio and indeterminate fallback", () => {
    expect(resolveProgressRatio(25, 100, false)).toBe(0.25);
    expect(resolveProgressRatio(25, 100, true)).toBe(INDETERMINATE_PROGRESS_RATIO);
    expect(INDETERMINATE_PROGRESS_RATIO).toBe(0.25);
  });

  it("keeps a fractional max instead of flooring it to 1", () => {
    expect(resolveProgressRatio(0.25, 0.5)).toBe(0.5);
    expect(clampProgressValue(2, 0.5)).toBe(0.5);
  });

  it("falls back to a max of 100 only when max is not positive", () => {
    expect(resolveProgressMax(undefined)).toBe(100);
    expect(resolveProgressMax(0)).toBe(100);
    expect(resolveProgressMax(-5)).toBe(100);
    expect(resolveProgressMax(0.5)).toBe(0.5);
    expect(resolveProgressRatio(25, 0)).toBe(0.25);
  });
});
