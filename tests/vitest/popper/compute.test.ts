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

  it("keeps bottom placement centered for wrapper origin and visible content edge", () => {
    const anchorPosition = vector2(300, 200);
    const anchorSize = vector2(100, 30);
    const contentSize = vector2(200, 100);

    const result = computePopper({
      anchorPosition,
      anchorSize,
      contentSize,
      viewportRect: new Rect(0, 0, 1200, 800),
      placement: "bottom",
    });

    const resolvedPosition = offsets(result.position);
    const wrapperOriginLeft = resolvedPosition.x - result.anchorPoint.X * contentSize.X;
    const visibleContentLeft = wrapperOriginLeft + 0; // inner content remains at local x=0
    const expectedCenteredLeft = anchorPosition.X + anchorSize.X / 2 - contentSize.X / 2;

    expect(result.placement).toBe("bottom");
    expect(result.anchorPoint).toEqual(new Vector2(0.5, 0));
    expect(wrapperOriginLeft).toBe(expectedCenteredLeft);
    expect(visibleContentLeft).toBe(expectedCenteredLeft);
  });

  it("applies explicit placement with side and align offsets", () => {
    const result = computePopper({
      anchorPosition: vector2(80, 120),
      anchorSize: vector2(60, 20),
      contentSize: vector2(40, 30),
      viewportRect: new Rect(0, 0, 500, 500),
      placement: "top",
      sideOffset: 4,
      alignOffset: 3,
    });

    expect(result.placement).toBe("top");
    expect(result.anchorPoint).toEqual(new Vector2(0.5, 1));
    expect(offsets(result.position)).toEqual({ x: 113, y: 116 });
  });

  it("applies sideOffset for bottom as a vertical gap", () => {
    const result = computePopper({
      anchorPosition: vector2(80, 120),
      anchorSize: vector2(60, 20),
      contentSize: vector2(40, 30),
      viewportRect: new Rect(0, 0, 500, 500),
      placement: "bottom",
      sideOffset: 6,
    });

    expect(result.placement).toBe("bottom");
    expect(result.anchorPoint).toEqual(new Vector2(0.5, 0));
    expect(offsets(result.position)).toEqual({ x: 110, y: 146 });
  });

  it("keeps bottom sideOffset centered horizontally", () => {
    const baseline = computePopper({
      anchorPosition: vector2(80, 120),
      anchorSize: vector2(60, 20),
      contentSize: vector2(40, 30),
      viewportRect: new Rect(0, 0, 500, 500),
      placement: "bottom",
    });

    const withSideOffset = computePopper({
      anchorPosition: vector2(80, 120),
      anchorSize: vector2(60, 20),
      contentSize: vector2(40, 30),
      viewportRect: new Rect(0, 0, 500, 500),
      placement: "bottom",
      sideOffset: 8,
    });

    expect(withSideOffset.placement).toBe("bottom");
    expect(offsets(withSideOffset.position).x).toBe(offsets(baseline.position).x);
    expect(offsets(withSideOffset.position).y).toBe(offsets(baseline.position).y + 8);
  });

  it("reinterprets sideOffset on the resolved side after bottom flips", () => {
    const result = computePopper({
      anchorPosition: vector2(100, 80),
      anchorSize: vector2(20, 20),
      contentSize: vector2(80, 170),
      viewportRect: new Rect(0, 0, 240, 180),
      placement: "bottom",
      sideOffset: 12,
      collisionPadding: 0,
    });

    expect(result.placement).toBe("right");
    expect(result.anchorPoint).toEqual(new Vector2(0, 0.5));
    expect(offsets(result.position)).toEqual({ x: 132, y: 90 });
  });

  it("applies alignOffset only on the cross axis", () => {
    const withoutAlign = computePopper({
      anchorPosition: vector2(50, 50),
      anchorSize: vector2(20, 20),
      contentSize: vector2(40, 30),
      viewportRect: new Rect(0, 0, 500, 500),
      placement: "right",
      sideOffset: 5,
    });

    const withAlign = computePopper({
      anchorPosition: vector2(50, 50),
      anchorSize: vector2(20, 20),
      contentSize: vector2(40, 30),
      viewportRect: new Rect(0, 0, 500, 500),
      placement: "right",
      sideOffset: 5,
      alignOffset: 7,
    });

    expect(withAlign.placement).toBe("right");
    expect(offsets(withAlign.position).x).toBe(offsets(withoutAlign.position).x);
    expect(offsets(withAlign.position).y).toBe(offsets(withoutAlign.position).y + 7);
  });

  it("prefers opposite side over orthogonal fallback when improvement is small", () => {
    const result = computePopper({
      anchorPosition: vector2(88, 0),
      anchorSize: vector2(20, 20),
      contentSize: vector2(40, 40),
      viewportRect: new Rect(0, 0, 100, 100),
      placement: "top",
      collisionPadding: 0,
    });

    expect(result.placement).toBe("bottom");
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
      collisionPadding: 8,
    });

    // Content is larger than viewport. Position should still clamp within collision padding.
    expect(result.placement).toBe("right");
    expect(result.anchorPoint).toEqual(new Vector2(0, 0.5));
    expect(offsets(result.position)).toEqual({ x: 8, y: 78 });
  });

  it("respects collisionPadding while clamping near lower bounds", () => {
    const result = computePopper({
      anchorPosition: vector2(4, 4),
      anchorSize: vector2(10, 10),
      contentSize: vector2(20, 20),
      viewportRect: new Rect(0, 0, 40, 40),
      placement: "left",
      collisionPadding: 6,
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
      collisionPadding: 8,
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
      collisionPadding: 8,
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
      collisionPadding: 8,
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
      collisionPadding: 8,
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
      collisionPadding: 0,
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
      collisionPadding: 0,
    });

    expect(result.placement).toBe("bottom");
    expect(offsets(result.position)).toEqual({ x: 45, y: 20 });
  });
});
