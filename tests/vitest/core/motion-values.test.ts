// @ts-nocheck
import { describe, expect, it } from "vitest";

import {
  areMotionValuesEqual,
  canInterpolateMotionValue,
  interpolateMotionValue,
  isMotionValueSettled,
} from "../../../packages/react/motion/src/targets/instance";

describe("areMotionValuesEqual", () => {
  it("returns true for identical references", () => {
    const value = new UDim2(0, 10, 0, 20);
    expect(areMotionValuesEqual(value, value)).toBe(true);
  });

  it("compares numbers against the default precision", () => {
    expect(areMotionValuesEqual(1, 1.0004)).toBe(true);
    expect(areMotionValuesEqual(1, 1.001)).toBe(false);
  });

  it("compares UDim2 by max component distance", () => {
    expect(areMotionValuesEqual(new UDim2(0, 10, 0, 20), new UDim2(0, 10.0004, 0, 20))).toBe(true);
    expect(areMotionValuesEqual(new UDim2(0, 10, 0, 20), new UDim2(0, 11, 0, 20))).toBe(false);
  });

  it("compares Vector2 by max component distance", () => {
    expect(areMotionValuesEqual(new Vector2(1, 2), new Vector2(1.0003, 2))).toBe(true);
    expect(areMotionValuesEqual(new Vector2(1, 2), new Vector2(1, 5))).toBe(false);
  });

  it("returns false for incompatible types", () => {
    expect(areMotionValuesEqual(1, new UDim2(0, 1, 0, 1))).toBe(false);
  });
});

describe("canInterpolateMotionValue", () => {
  it("allows same-kind pairs", () => {
    expect(canInterpolateMotionValue(0, 10)).toBe(true);
    expect(canInterpolateMotionValue(new UDim2(0, 0, 0, 0), new UDim2(0, 10, 0, 10))).toBe(true);
    expect(canInterpolateMotionValue(new Vector2(0, 0), new Vector2(1, 1))).toBe(true);
  });

  it("rejects different kinds", () => {
    expect(canInterpolateMotionValue(0, new Vector2(1, 1))).toBe(false);
  });

  it("allows identical references", () => {
    const value = new Vector2(3, 4);
    expect(canInterpolateMotionValue(value, value)).toBe(true);
  });
});

describe("interpolateMotionValue", () => {
  it("returns the from reference when alpha is at or below zero", () => {
    const from = new Vector2(0, 0);
    const to = new Vector2(10, 10);
    expect(interpolateMotionValue(from, to, 0)).toBe(from);
    expect(interpolateMotionValue(from, to, -0.5)).toBe(from);
  });

  it("returns the to reference when alpha is at or above one", () => {
    const from = new Vector2(0, 0);
    const to = new Vector2(10, 10);
    expect(interpolateMotionValue(from, to, 1)).toBe(to);
    expect(interpolateMotionValue(from, to, 1.5)).toBe(to);
  });

  it("lerps numbers at the midpoint", () => {
    expect(interpolateMotionValue(0, 10, 0.5)).toBeCloseTo(5, 10);
  });

  it("lerps UDim2 components at the midpoint", () => {
    const result = interpolateMotionValue(new UDim2(0, 0, 0, 0), new UDim2(1, 10, 1, 20), 0.5);
    expect(result.X.Scale).toBeCloseTo(0.5, 10);
    expect(result.X.Offset).toBeCloseTo(5, 10);
    expect(result.Y.Scale).toBeCloseTo(0.5, 10);
    expect(result.Y.Offset).toBeCloseTo(10, 10);
  });

  it("lerps Vector2 at the midpoint", () => {
    const result = interpolateMotionValue(new Vector2(0, 0), new Vector2(10, 20), 0.5);
    expect(result.X).toBeCloseTo(5, 10);
    expect(result.Y).toBeCloseTo(10, 10);
  });

  it("falls back to from for incompatible types mid-interpolation", () => {
    const from = 0;
    const to = new UDim2(0, 10, 0, 10);
    expect(interpolateMotionValue(from, to, 0.5)).toBe(from);
  });
});

describe("isMotionValueSettled", () => {
  it("mirrors areMotionValuesEqual", () => {
    expect(isMotionValueSettled(1, 1.0004)).toBe(true);
    expect(isMotionValueSettled(new Vector2(0, 0), new Vector2(0, 5))).toBe(false);
  });
});
