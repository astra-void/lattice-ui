import { describe, expect, it } from "vitest";
import {
  defaultComboboxFilter,
  filterComboboxOptions,
  getNavigableComboboxValues,
  moveComboboxHighlight,
  resolveComboboxHighlight,
  resolveComboboxInputValue,
  resolveForcedComboboxValue,
} from "../../../packages/react/combobox/src/Combobox/logic";

describe("combobox logic", () => {
  it("filters options by query", () => {
    const options = [
      { value: "alpha", disabled: false, textValue: "Alpha" },
      { value: "beta", disabled: false, textValue: "Beta" },
    ];

    const filtered = filterComboboxOptions(options, "al", defaultComboboxFilter);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.value).toBe("alpha");
  });

  it("forces value to first enabled when selected option is disabled", () => {
    const options = [
      { value: "alpha", disabled: false, textValue: "Alpha" },
      { value: "beta", disabled: true, textValue: "Beta" },
    ];

    expect(resolveForcedComboboxValue("beta", options)).toBe("alpha");
  });

  it("keeps an enabled selection as-is", () => {
    const options = [
      { value: "alpha", disabled: false, textValue: "Alpha" },
      { value: "beta", disabled: false, textValue: "Beta" },
    ];

    expect(resolveForcedComboboxValue("beta", options)).toBe("beta");
  });

  it("does not force a value while the selected option is not registered yet", () => {
    const options = [{ value: "alpha", disabled: false, textValue: "Alpha" }];

    expect(resolveForcedComboboxValue("beta", options)).toBeUndefined();
    expect(resolveForcedComboboxValue(undefined, options)).toBeUndefined();
  });

  it("returns undefined when the selected option is disabled and no option is enabled", () => {
    const options = [
      { value: "alpha", disabled: true, textValue: "Alpha" },
      { value: "beta", disabled: true, textValue: "Beta" },
    ];

    expect(resolveForcedComboboxValue("beta", options)).toBeUndefined();
  });

  it("resolves input text from selected value", () => {
    const options = [
      { value: "alpha", disabled: false, textValue: "Alpha Option" },
      { value: "beta", disabled: false, textValue: "Beta Option" },
    ];

    expect(resolveComboboxInputValue("beta", options)).toBe("Beta Option");
    expect(resolveComboboxInputValue(undefined, options, "")).toBe("");
  });

  it("navigates only enabled options that match the query", () => {
    const options = [
      { value: "alpha", disabled: false, textValue: "Alpha" },
      { value: "alps", disabled: true, textValue: "Alps" },
      { value: "beta", disabled: false, textValue: "Beta" },
      { value: "alder", disabled: false, textValue: "Alder" },
    ];

    expect(getNavigableComboboxValues(options, "al", defaultComboboxFilter)).toEqual(["alpha", "alder"]);
  });

  it("moves the highlight with wrap-around and enters from either end", () => {
    const navigable = ["a", "b", "c"];

    expect(moveComboboxHighlight(navigable, undefined, 1)).toBe("a");
    expect(moveComboboxHighlight(navigable, undefined, -1)).toBe("c");
    expect(moveComboboxHighlight(navigable, "a", 1)).toBe("b");
    expect(moveComboboxHighlight(navigable, "c", 1)).toBe("a");
    expect(moveComboboxHighlight(navigable, "a", -1)).toBe("c");
    expect(moveComboboxHighlight(navigable, "gone", 1)).toBe("a");
    expect(moveComboboxHighlight([], "a", 1)).toBeUndefined();
  });

  it("clamps the highlight when the filtered set shrinks", () => {
    expect(resolveComboboxHighlight(["a", "b"], "b", undefined, "")).toBe("b");
    expect(resolveComboboxHighlight(["a"], "b", "a", "x")).toBe("a");
    expect(resolveComboboxHighlight(["a", "c"], "b", undefined, "x")).toBe("a");
    expect(resolveComboboxHighlight(["a", "c"], undefined, undefined, "")).toBeUndefined();
    expect(resolveComboboxHighlight([], "b", "a", "x")).toBeUndefined();
  });
});
