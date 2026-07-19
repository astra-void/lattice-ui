// Regression tests for the ScreenGui viewport rect used for popper collision
// detection and clamping.
//
// AbsolutePosition space in Roblox is measured from the top-left of the
// inset-adjusted area (below the topbar):
// - An IgnoreGuiInset=true ScreenGui spans the full screen; a child at its
//   top-left reports AbsolutePosition (0, -inset), so the valid rect is
//   [-inset, AbsoluteSize - inset].
// - A default ScreenGui starts at the origin and its AbsoluteSize already
//   excludes the inset, so the valid rect is [0, AbsoluteSize].
//
// The previous implementation had the two branches swapped, shifting every
// popover/tooltip collision rect down by the topbar inset (36px).

import { describe, expect, it } from "vitest";
import { resolveScreenGuiViewportRect } from "../../../packages/react/popper/src/usePopper";

const INSET = new Vector2(0, 36);
const FULL_SCREEN = new Vector2(1920, 1080);
const INSET_SCREEN = new Vector2(1920, 1044);

describe("resolveScreenGuiViewportRect", () => {
  it("spans [-inset, size - inset] for an IgnoreGuiInset ScreenGui", () => {
    const rect = resolveScreenGuiViewportRect(true, FULL_SCREEN, INSET);

    // toBeCloseTo: the X inset of 0 negates to JS -0, which toBe rejects.
    expect(rect.Min.X).toBeCloseTo(0);
    expect(rect.Min.Y).toBe(-36);
    expect(rect.Max.X).toBe(1920);
    expect(rect.Max.Y).toBe(1044);
  });

  it("spans [0, size] for a default (inset-respecting) ScreenGui", () => {
    const rect = resolveScreenGuiViewportRect(false, INSET_SCREEN, INSET);

    expect(rect.Min.X).toBe(0);
    expect(rect.Min.Y).toBe(0);
    expect(rect.Max.X).toBe(1920);
    expect(rect.Max.Y).toBe(1044);
  });

  it("both gui kinds agree on the physical bottom edge of the screen", () => {
    const ignoring = resolveScreenGuiViewportRect(true, FULL_SCREEN, INSET);
    const respecting = resolveScreenGuiViewportRect(false, INSET_SCREEN, INSET);

    // Same physical screen: the usable bottom edge must be identical in
    // AbsolutePosition space regardless of the gui's inset mode.
    expect(ignoring.Max.Y).toBe(respecting.Max.Y);
  });

  it("handles a horizontal inset component", () => {
    const rect = resolveScreenGuiViewportRect(true, FULL_SCREEN, new Vector2(10, 36));

    expect(rect.Min.X).toBe(-10);
    expect(rect.Max.X).toBe(1910);
  });
});
