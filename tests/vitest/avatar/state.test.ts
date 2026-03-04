import { describe, expect, it } from "vitest";
import { resolveAvatarFallbackVisible } from "../../../packages/avatar/src/Avatar/state";

describe("avatar fallback state", () => {
  it("hides fallback for loaded status", () => {
    expect(resolveAvatarFallbackVisible("loaded", true)).toBe(false);
  });

  it("shows fallback for error status", () => {
    expect(resolveAvatarFallbackVisible("error", false)).toBe(true);
  });

  it("waits for delay when loading", () => {
    expect(resolveAvatarFallbackVisible("loading", false)).toBe(false);
    expect(resolveAvatarFallbackVisible("loading", true)).toBe(true);
  });
});
