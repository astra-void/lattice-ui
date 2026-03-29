import { describe, expect, it } from "vitest";
import { parseJsonText } from "../../../packages/cli/src/core/fs/json";
import { mergeMissing, mergeStringArraysUnique, upsertDependencySpecs } from "../../../packages/cli/src/core/fs/patch";

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

  it("merges string arrays uniquely when applying template defaults", () => {
    const merged = mergeMissing(
      { typeRoots: ["node_modules/@rbxts", "node_modules/@lattice-ui"] },
      { typeRoots: ["node_modules/@rbxts"] },
    ) as {
      typeRoots: string[];
    };

    expect(merged.typeRoots).toEqual(["node_modules/@rbxts", "node_modules/@lattice-ui"]);
  });

  it("parses json with comments and trailing commas", () => {
    const parsed = parseJsonText<{ compilerOptions: { strict: boolean } }>(`{
      "compilerOptions": {
        // required
        "strict": true,
      },
    }`);

    expect(parsed.compilerOptions.strict).toBe(true);
  });
});
