// @ts-nocheck

import { describe, expect, it } from "vitest";
import { getElementRef } from "../../../packages/core/src/refs";

describe("core ref helpers", () => {
  it("resolves refs from props first and falls back to the element ref field", () => {
    const propsRef = { current: undefined };
    const elementRef = { current: undefined };

    expect(getElementRef({ props: { ref: propsRef }, ref: elementRef })).toBe(propsRef);
    expect(getElementRef({ props: {}, ref: elementRef })).toBe(elementRef);
  });
});
