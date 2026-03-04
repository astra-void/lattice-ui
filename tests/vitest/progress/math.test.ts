import { describe, expect, it } from "vitest";
import { clampProgressValue, resolveProgressRatio } from "../../../packages/progress/src/Progress/math";

describe("progress math", () => {
  it("clamps value within [0, max]", () => {
    expect(clampProgressValue(-10, 100)).toBe(0);
    expect(clampProgressValue(120, 100)).toBe(100);
  });

  it("computes ratio and indeterminate fallback", () => {
    expect(resolveProgressRatio(25, 100, false)).toBe(0.25);
    expect(resolveProgressRatio(25, 100, true)).toBe(0.25);
  });
});
