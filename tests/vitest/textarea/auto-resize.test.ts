import { describe, expect, it } from "vitest";
import { resolveTextareaHeight } from "../../../packages/textarea/src/Textarea/autoResize";

describe("textarea auto-resize", () => {
  it("honors minRows", () => {
    const height = resolveTextareaHeight("", {
      minRows: 3,
      lineHeight: 18,
      verticalPadding: 10,
    });

    expect(height).toBe(64);
  });

  it("grows with newline count and clamps with maxRows", () => {
    const text = "a\nb\nc\nd\ne";
    const height = resolveTextareaHeight(text, {
      minRows: 1,
      maxRows: 3,
      lineHeight: 20,
      verticalPadding: 0,
    });

    expect(height).toBe(60);
  });
});
