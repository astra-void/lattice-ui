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
      viewportRect: new Rect(0, 0, 500, 500),
    });

    expect(result.placement).toBe("bottom");
    expect(result.anchorPoint).toEqual(new Vector2(0.5, 0));
    expect(offsets(result.position)).toEqual({ x: 60, y: 60 });
  });

  it("applies explicit placement and offset", () => {
    const result = computePopper({
      anchorPosition: vector2(80, 120),
      anchorSize: vector2(60, 20),
      contentSize: vector2(40, 30),
      viewportRect: new Rect(0, 0, 500, 500),
      placement: "top",
      offset: vector2(3, -4),
    });

    expect(result.placement).toBe("top");
    expect(result.anchorPoint).toEqual(new Vector2(0.5, 1));
    expect(offsets(result.position)).toEqual({ x: 113, y: 116 });
  });

  it("flips to fallback placement when primary placement overflows", () => {
    const result = computePopper({
      anchorPosition: vector2(100, 5),
      anchorSize: vector2(50, 20),
      contentSize: vector2(40, 40),
      viewportRect: new Rect(0, 0, 300, 300),
      placement: "top",
    });

    expect(result.placement).toBe("bottom");
    expect(result.anchorPoint).toEqual(new Vector2(0.5, 0));
    expect(offsets(result.position)).toEqual({ x: 125, y: 25 });
  });

  it("clamps position to viewport padding bounds", () => {
    const result = computePopper({
      anchorPosition: vector2(10, 10),
      anchorSize: vector2(10, 10),
      contentSize: vector2(120, 140),
      viewportRect: new Rect(0, 0, 100, 100),
      placement: "right",
      padding: 8,
    });

    // Content is larger than viewport. 'bottom' ends up with less overflow (65) than 'right' (75).
    // Clamped TopLeft is (8, 8). For bottom, anchorPoint is (0.5, 0).
    expect(result.placement).toBe("bottom");
    expect(result.anchorPoint).toEqual(new Vector2(0.5, 0));
    expect(offsets(result.position)).toEqual({ x: 68, y: 8 }); // 8 + 0.5*120, 8 + 0*140
  });

  it("respects padding while clamping near lower bounds", () => {
    const result = computePopper({
      anchorPosition: vector2(4, 4),
      anchorSize: vector2(10, 10),
      contentSize: vector2(20, 20),
      viewportRect: new Rect(0, 0, 40, 40),
      placement: "left",
      padding: 6,
    });

    // 'right' is much better here because it avoids the left boundary entirely.
    // Clamped TopLeft is x=14, y=6. AnchorPoint for right is (0, 0.5).
    expect(result.placement).toBe("right");
    expect(result.anchorPoint).toEqual(new Vector2(0, 0.5));
    expect(offsets(result.position)).toEqual({ x: 14, y: 16 }); // 14 + 0*20, 6 + 0.5*20
  });

  it("chooses orthogonal side when requested and opposite both overflow", () => {
    const result = computePopper({
      anchorPosition: vector2(10, 100),
      anchorSize: vector2(20, 20),
      contentSize: vector2(50, 150),
      viewportRect: new Rect(0, 0, 300, 200),
      placement: "top",
      padding: 8,
    });

    expect(result.placement).toBe("right");
    expect(result.anchorPoint).toEqual(new Vector2(0, 0.5));
  });

  it("chooses the least-overflow placement when all overflow", () => {
    const result = computePopper({
      anchorPosition: vector2(5, 5),
      anchorSize: vector2(20, 20),
      contentSize: vector2(190, 190),
      viewportRect: new Rect(0, 0, 200, 200),
      placement: "top",
      padding: 8,
    });

    expect(result.placement).toBe("bottom");
  });

  it("handles corner cases correctly without detaching", () => {
    const result = computePopper({
      anchorPosition: vector2(280, 280),
      anchorSize: vector2(20, 20),
      contentSize: vector2(100, 100),
      viewportRect: new Rect(0, 0, 300, 300),
      placement: "right",
      padding: 8,
    });

    expect(result.placement).toBe("left");
    expect(offsets(result.position)).toEqual({ x: 280, y: 242 });
  });

  it("keeps placement consistent when content is larger than viewport", () => {
    const result = computePopper({
      anchorPosition: vector2(50, 50),
      anchorSize: vector2(20, 20),
      contentSize: vector2(500, 500),
      viewportRect: new Rect(0, 0, 200, 200),
      placement: "bottom",
      padding: 8,
    });

    expect(result.placement).toBe("bottom");
    expect(result.anchorPoint).toEqual(new Vector2(0.5, 0));
    expect(offsets(result.position)).toEqual({ x: 258, y: 8 });
  });

  it("computes overflow correctly with non-zero viewport origin", () => {
    const result = computePopper({
      anchorPosition: vector2(20, 20),
      anchorSize: vector2(20, 20),
      contentSize: vector2(40, 40),
      viewportRect: new Rect(10, 10, 110, 110),
      placement: "top",
      padding: 0,
    });

    expect(result.placement).toBe("bottom");
  });

  it("clamps to non-zero viewport origin", () => {
    const result = computePopper({
      anchorPosition: vector2(0, 0),
      anchorSize: vector2(10, 10),
      contentSize: vector2(50, 50),
      viewportRect: new Rect(20, 20, 120, 120),
      placement: "bottom",
      padding: 0,
    });

    expect(result.placement).toBe("bottom");
    expect(offsets(result.position)).toEqual({ x: 45, y: 20 });
  });
});
