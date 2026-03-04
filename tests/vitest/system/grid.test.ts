import { describe, expect, it } from "vitest";
import { resolveGridCellWidth, resolveGridColumns } from "../../../packages/system/src/layout/gridMath";

describe("system grid math", () => {
  it("prefers explicit columns", () => {
    expect(resolveGridColumns(1000, { columns: 4, minColumnWidth: 200, columnGap: 8 })).toBe(4);
  });

  it("derives columns from minColumnWidth", () => {
    expect(resolveGridColumns(520, { minColumnWidth: 120, columnGap: 8 })).toBe(4);
  });

  it("derives cell width from container width and gaps", () => {
    expect(resolveGridCellWidth(520, 4, 8)).toBe(124);
  });
});
