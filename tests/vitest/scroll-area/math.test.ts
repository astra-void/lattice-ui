import { describe, expect, it } from "vitest";
import {
  resolveCanvasPositionFromThumbOffset,
  resolveThumbOffset,
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
});
