import { describe, expect, it } from "vitest";
import { mergeStringArraysUnique, upsertDependencySpecs } from "../../../packages/cli/src/core/fs/patch";

describe("json patch helpers", () => {
  it("applies dependency updates idempotently", () => {
    const manifest: Record<string, unknown> = {
      dependencies: {
        "@lattice-ui/style": "^0.1.0",
      },
    };

    const first = upsertDependencySpecs(manifest, "dependencies", ["@lattice-ui/popover@latest"]);
    expect(first.changed).toBe(true);

    const second = upsertDependencySpecs(manifest, "dependencies", ["@lattice-ui/popover@latest"]);
    expect(second.changed).toBe(false);

    expect(manifest.dependencies).toEqual({
      "@lattice-ui/popover": "@lattice-ui/popover@latest",
      "@lattice-ui/style": "^0.1.0",
    });
  });

  it("dedupes list merges", () => {
    const merged = mergeStringArraysUnique(["a", "b"], ["b", "c", "c"]);
    expect(merged).toEqual(["a", "b", "c"]);
  });
});
