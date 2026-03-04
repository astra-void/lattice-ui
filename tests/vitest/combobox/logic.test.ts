import { describe, expect, it } from "vitest";
import {
  defaultComboboxFilter,
  filterComboboxOptions,
  resolveComboboxInputValue,
  resolveForcedComboboxValue,
} from "../../../packages/combobox/src/Combobox/logic";

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

  it("resolves input text from selected value", () => {
    const options = [
      { value: "alpha", disabled: false, textValue: "Alpha Option" },
      { value: "beta", disabled: false, textValue: "Beta Option" },
    ];

    expect(resolveComboboxInputValue("beta", options)).toBe("Beta Option");
    expect(resolveComboboxInputValue(undefined, options, "")).toBe("");
  });
});
