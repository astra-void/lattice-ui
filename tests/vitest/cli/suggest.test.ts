import { describe, expect, it } from "vitest";
import { didYouMean, suggestClosest } from "../../../packages/tools/cli/src/core/suggest";

describe("suggestClosest", () => {
  it("ranks nearer candidates first", () => {
    expect(suggestClosest("dialogg", ["dialog", "dialogs", "toast"])).toEqual(["dialog", "dialogs"]);
  });

  it("matches case-insensitively", () => {
    expect(suggestClosest("Dialog", ["dialog"])).toEqual(["dialog"]);
  });

  it("returns nothing when no candidate is close enough", () => {
    expect(suggestClosest("zzz", ["dialog", "toast", "tooltip"])).toEqual([]);
  });

  it("keeps short inputs strict so unrelated commands are not suggested", () => {
    expect(suggestClosest("add", ["remove", "upgrade", "doctor"])).toEqual([]);
  });

  it("caps the number of suggestions", () => {
    expect(suggestClosest("tab", ["tabs", "tab1", "tab2", "tab3"], 2)).toHaveLength(2);
  });
});

describe("didYouMean", () => {
  it("joins multiple candidates", () => {
    expect(didYouMean("tabss", ["tabs", "tabsx"])).toBe("Did you mean `tabs` or `tabsx`?");
  });

  it("is undefined when there is no match", () => {
    expect(didYouMean("zzz", ["dialog"])).toBeUndefined();
  });
});
