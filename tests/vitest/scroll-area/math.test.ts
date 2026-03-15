import { describe, expect, it } from "vitest";
import {
  resolveCanvasPositionFromThumbOffset,
  resolveCanvasPositionFromTrackPosition,
  resolveThumbOffset,
  resolveThumbOffsetFromPointerDelta,
  resolveThumbOffsetFromTrackPosition,
  resolveThumbSize,
} from "../../../packages/scroll-area/src/ScrollArea/scrollMath";

describe("scroll-area math", () => {
  it("computes thumb size proportionally", () => {
    expect(resolveThumbSize(100, 400, 100, 10)).toBe(25);
  });

  it("computes thumb offset from canvas position", () => {
    const thumbSize = resolveThumbSize(100, 400, 100, 10);
    const offset = resolveThumbOffset(150, 100, 400, 100, thumbSize);
    expect(offset).toBeGreaterThan(0);
  });

  it("maps thumb offset back to canvas position", () => {
    const thumbSize = resolveThumbSize(100, 400, 100, 10);
    const scroll = resolveCanvasPositionFromThumbOffset(25, 100, 400, 100, thumbSize);
    expect(scroll).toBeGreaterThan(0);
  });

  it("maps track clicks to a centered thumb offset", () => {
    expect(resolveThumbOffsetFromTrackPosition(50, 100, 20)).toBe(40);
  });

  it("clamps drag deltas inside the scrollbar track", () => {
    expect(resolveThumbOffsetFromPointerDelta(10, 200, 100, 25)).toBe(75);
    expect(resolveThumbOffsetFromPointerDelta(10, -50, 100, 25)).toBe(0);
  });

  it("keeps track-position canvas mapping inert when there is no overflow", () => {
    expect(resolveCanvasPositionFromTrackPosition(25, 100, 100, 100, 100)).toBe(0);
  });
});
