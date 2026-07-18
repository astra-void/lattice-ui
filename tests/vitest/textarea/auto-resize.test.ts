import { describe, expect, it } from "vitest";
import { resolveAutoResizeSize, resolveTextareaHeight } from "../../../packages/textarea/src/Textarea/autoResize";

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

  it("uses measuredRows for wrapped content without explicit newlines", () => {
    const height = resolveTextareaHeight("wrapped text", {
      minRows: 1,
      lineHeight: 18,
      verticalPadding: 0,
      measuredRows: 4,
    });

    expect(height).toBe(72);
  });
});

describe("resolveAutoResizeSize", () => {
  it("preserves the X scale component for full-width textareas", () => {
    const current = new UDim2(1, 0, 0, 68);
    const next = resolveAutoResizeSize(current, 100);

    expect(next).toBeDefined();
    expect(next!.X.Scale).toBe(1);
    expect(next!.X.Offset).toBe(0);
    expect(next!.Y.Scale).toBe(0);
    expect(next!.Y.Offset).toBe(100);
  });

  it("preserves a fixed pixel width", () => {
    const current = new UDim2(0, 240, 0, 68);
    const next = resolveAutoResizeSize(current, 84);

    expect(next!.X.Scale).toBe(0);
    expect(next!.X.Offset).toBe(240);
    expect(next!.Y.Offset).toBe(84);
  });

  it("skips the write when the height already matches", () => {
    const current = new UDim2(1, 0, 0, 68);

    expect(resolveAutoResizeSize(current, 68)).toBeUndefined();
  });

  it("rewrites a scale-based height into an offset height", () => {
    const current = new UDim2(1, 0, 0.5, 0);
    const next = resolveAutoResizeSize(current, 68);

    expect(next).toBeDefined();
    expect(next!.Y.Scale).toBe(0);
    expect(next!.Y.Offset).toBe(68);
    expect(next!.X.Scale).toBe(1);
  });
});
