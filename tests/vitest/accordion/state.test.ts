import { describe, expect, it } from "vitest";
import { nextAccordionValues, normalizeAccordionValue } from "../../../packages/accordion/src/Accordion/state";

describe("accordion state", () => {
  it("normalizes single and multiple values", () => {
    expect(normalizeAccordionValue("single", "alpha")).toEqual(["alpha"]);
    expect(normalizeAccordionValue("single", ["alpha", "beta"])).toEqual(["alpha"]);
    expect(normalizeAccordionValue("multiple", ["alpha", "alpha", "beta"])).toEqual(["alpha", "beta"]);
  });

  it("computes next values for single accordion", () => {
    expect(nextAccordionValues("single", ["alpha"], "beta", true)).toEqual(["beta"]);
    expect(nextAccordionValues("single", ["alpha"], "alpha", true)).toEqual([]);
  });

  it("computes next values for multiple accordion", () => {
    expect(nextAccordionValues("multiple", ["alpha"], "beta", false)).toEqual(["alpha", "beta"]);
    expect(nextAccordionValues("multiple", ["alpha", "beta"], "beta", false)).toEqual(["alpha"]);
  });
});
