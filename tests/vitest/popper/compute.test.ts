import { describe, expect, it } from "vitest";
import { computePopper } from "../../../packages/popper/src/compute";

function vector2(x: number, y: number) {
  return new Vector2(x, y);
}

function offsets(position: unknown) {
  const value = position as { X: { Offset: number }; Y: { Offset: number } };
  return {
    x: value.X.Offset,
    y: value.Y.Offset,
  };
}

describe("computePopper", () => {
  it("computes bottom placement by default", () => {
    const result = computePopper({
      anchorPosition: vector2(10, 20),
      anchorSize: vector2(100, 40),
      contentSize: vector2(50, 30),
      viewportSize: vector2(500, 500),
    });

    expect(result.placement).toBe("bottom");
    expect(offsets(result.position)).toEqual({ x: 35, y: 60 });
  });

  it("applies explicit placement and offset", () => {
    const result = computePopper({
      anchorPosition: vector2(80, 120),
      anchorSize: vector2(60, 20),
      contentSize: vector2(40, 30),
      viewportSize: vector2(500, 500),
      placement: "top",
      offset: vector2(3, -4),
    });

    expect(result.placement).toBe("top");
    expect(offsets(result.position)).toEqual({ x: 93, y: 86 });
  });

  it("flips to fallback placement when primary placement overflows", () => {
    const result = computePopper({
      anchorPosition: vector2(100, 5),
      anchorSize: vector2(50, 20),
      contentSize: vector2(40, 40),
      viewportSize: vector2(300, 300),
      placement: "top",
    });

    expect(result.placement).toBe("bottom");
    expect(offsets(result.position)).toEqual({ x: 105, y: 25 });
  });

  it("clamps position to viewport padding bounds", () => {
    const result = computePopper({
      anchorPosition: vector2(10, 10),
      anchorSize: vector2(10, 10),
      contentSize: vector2(120, 140),
      viewportSize: vector2(100, 100),
      placement: "right",
      padding: 8,
    });

    expect(result.placement).toBe("right");
    expect(offsets(result.position)).toEqual({ x: 8, y: 8 });
  });

  it("respects padding while clamping near lower bounds", () => {
    const result = computePopper({
      anchorPosition: vector2(4, 4),
      anchorSize: vector2(10, 10),
      contentSize: vector2(20, 20),
      viewportSize: vector2(40, 40),
      placement: "left",
      padding: 6,
    });

    expect(offsets(result.position)).toEqual({ x: 6, y: 6 });
  });
});
