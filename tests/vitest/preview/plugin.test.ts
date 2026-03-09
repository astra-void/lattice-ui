import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createPreviewVitePlugin } from "../../../packages/preview/src/source/plugin";
import { getHookHandler } from "./hookTestUtils";

const temporaryRoots: string[] = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    fs.rmSync(root, { force: true, recursive: true });
  }
});

describe("createPreviewVitePlugin", () => {
  it("suppresses partial hot updates for preview source files", async () => {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lattice-preview-plugin-"));
    temporaryRoots.push(fixtureRoot);

    const sourceRoot = path.join(fixtureRoot, "src");
    const sourceFile = path.join(sourceRoot, "AnimatedSlot.tsx");
    fs.mkdirSync(sourceRoot, { recursive: true });
    fs.writeFileSync(sourceFile, 'export function AnimatedSlot() { return <frame />; }\n', "utf8");

    const plugins = createPreviewVitePlugin({
      projectName: "Fixture Preview",
      targets: [
        {
          name: "fixture",
          packageName: "@fixtures/plugin",
          packageRoot: fixtureRoot,
          sourceRoot,
        },
      ],
    });
    const previewPlugin = Array.isArray(plugins) ? plugins[1] : undefined;
    const handleHotUpdate = getHookHandler(
      previewPlugin && typeof previewPlugin === "object" ? previewPlugin.handleHotUpdate : undefined,
    );

    expect(handleHotUpdate).toBeTypeOf("function");
    expect(handleHotUpdate?.call({} as never, { file: sourceFile } as never)).toEqual([]);
    expect(handleHotUpdate?.call({} as never, { file: path.join(fixtureRoot, "README.md") } as never)).toBe(
      undefined,
    );
  });
});
