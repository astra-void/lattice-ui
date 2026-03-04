import { describe, expect, it } from "vitest";
import {
  normalizeBounds,
  normalizeStep,
  pointerPositionToValue,
  snapValueToStep,
  valueToPercent,
} from "../../../packages/slider/src/Slider/internals/math";

function vector2(x: number, y: number) {
  return new Vector2(x, y);
}

describe("slider math helpers", () => {
  it("normalizes inverted bounds", () => {
    expect(normalizeBounds(10, -2)).toEqual({ min: -2, max: 10 });
    expect(normalizeBounds(3, 9)).toEqual({ min: 3, max: 9 });
  });

  it("normalizes invalid step and snaps/clamps values", () => {
    expect(normalizeStep(0)).toBe(1);
    expect(snapValueToStep(43, 0, 100, 10)).toBe(40);
    expect(snapValueToStep(128, 0, 100, 10)).toBe(100);
    expect(snapValueToStep(-9, 0, 100, 10)).toBe(0);
  });

  it("computes percentage from value", () => {
    expect(valueToPercent(50, 0, 100)).toBe(0.5);
    expect(valueToPercent(200, 0, 100)).toBe(1);
    expect(valueToPercent(-20, 0, 100)).toBe(0);
  });

  it("converts pointer positions to snapped values", () => {
    const horizontalValue = pointerPositionToValue(
      vector2(80, 0),
      vector2(0, 0),
      vector2(200, 20),
      0,
      100,
      5,
      "horizontal",
    );

    const verticalValue = pointerPositionToValue(
      vector2(0, 160),
      vector2(0, 0),
      vector2(20, 200),
      0,
      100,
      5,
      "vertical",
    );

    expect(horizontalValue).toBe(40);
    expect(verticalValue).toBe(20);
  });
});
