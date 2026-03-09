import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createPreviewVitePlugin } from "../../../packages/preview/src/source/plugin";
import { getHookHandler } from "./hookTestUtils";

const REGISTRY_MODULE_ID = "virtual:lattice-preview-registry";
const temporaryRoots: string[] = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    fs.rmSync(root, { force: true, recursive: true });
  }
});

function createFixtureRoot() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lattice-preview-plugin-"));
  const sourceRoot = path.join(fixtureRoot, "src");
  temporaryRoots.push(fixtureRoot);
  fs.mkdirSync(sourceRoot, { recursive: true });

  return {
    fixtureRoot,
    sourceRoot,
  };
}

function createPreviewPlugin(fixtureRoot: string, sourceRoot: string) {
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

  return Array.isArray(plugins) ? plugins[1] : undefined;
}

function createMockServer() {
  const watcherHandlers = new Map<string, Array<(filePath: string) => void>>();
  const registryModule = { id: "\0virtual:lattice-preview-registry" };

  return {
    emit(event: string, filePath: string) {
      for (const handler of watcherHandlers.get(event) ?? []) {
        handler(filePath);
      }
    },
    moduleGraph: {
      getModuleById: vi.fn(() => registryModule),
      invalidateModule: vi.fn(),
    },
    watcher: {
      on: vi.fn((event: string, handler: (filePath: string) => void) => {
        const handlers = watcherHandlers.get(event) ?? [];
        handlers.push(handler);
        watcherHandlers.set(event, handlers);
      }),
    },
    ws: {
      send: vi.fn(),
    },
  };
}

function readRegistryEntries(previewPlugin: ReturnType<typeof createPreviewPlugin>) {
  const resolveId = getHookHandler(previewPlugin && typeof previewPlugin === "object" ? previewPlugin.resolveId : undefined);
  const load = getHookHandler(previewPlugin && typeof previewPlugin === "object" ? previewPlugin.load : undefined);

  const resolvedRegistryId = resolveId?.call({} as never, REGISTRY_MODULE_ID) as string | undefined;
  const registryModuleCode = load?.call({} as never, resolvedRegistryId ?? REGISTRY_MODULE_ID);
  if (typeof registryModuleCode !== "string") {
    throw new Error("Expected the preview registry module to load as a string.");
  }

  const entriesMatch = registryModuleCode.match(/export const previewEntries = (\[[\s\S]*?\]);\nexport const previewImporters =/);
  if (!entriesMatch) {
    throw new Error(`Unable to parse preview registry module:\n${registryModuleCode}`);
  }

  return JSON.parse(entriesMatch[1] ?? "[]") as Array<{ relativePath: string; status: string }>;
}

describe("createPreviewVitePlugin", () => {
  it("suppresses partial hot updates for preview source files", async () => {
    const { fixtureRoot, sourceRoot } = createFixtureRoot();
    const sourceFile = path.join(sourceRoot, "AnimatedSlot.tsx");
    fs.writeFileSync(sourceFile, 'export function AnimatedSlot() { return <frame />; }\n', "utf8");

    const previewPlugin = createPreviewPlugin(fixtureRoot, sourceRoot);
    const handleHotUpdate = getHookHandler(
      previewPlugin && typeof previewPlugin === "object" ? previewPlugin.handleHotUpdate : undefined,
    );

    expect(handleHotUpdate).toBeTypeOf("function");
    expect(handleHotUpdate?.call({} as never, { file: sourceFile } as never)).toEqual([]);
    expect(handleHotUpdate?.call({} as never, { file: path.join(fixtureRoot, "README.md") } as never)).toBe(
      undefined,
    );
  });

  it("refreshes and reloads the registry for add, delete, rename, and non-target watcher events", () => {
    const { fixtureRoot, sourceRoot } = createFixtureRoot();
    const sourceFile = path.join(sourceRoot, "AnimatedSlot.tsx");
    const addedFile = path.join(sourceRoot, "FreshSlot.tsx");
    const renamedFile = path.join(sourceRoot, "RenamedSlot.tsx");
    fs.writeFileSync(sourceFile, 'export function AnimatedSlot() { return <frame />; }\n', "utf8");

    const previewPlugin = createPreviewPlugin(fixtureRoot, sourceRoot);
    const configureServer = getHookHandler(
      previewPlugin && typeof previewPlugin === "object" ? previewPlugin.configureServer : undefined,
    );
    const mockServer = createMockServer();

    configureServer?.call({} as never, mockServer as never);

    expect(readRegistryEntries(previewPlugin).map((entry) => entry.relativePath)).toEqual(["AnimatedSlot.tsx"]);

    fs.writeFileSync(addedFile, 'export function FreshSlot() { return <frame />; }\n', "utf8");
    mockServer.emit("add", addedFile);
    expect(readRegistryEntries(previewPlugin).map((entry) => entry.relativePath)).toEqual([
      "AnimatedSlot.tsx",
      "FreshSlot.tsx",
    ]);

    fs.renameSync(addedFile, renamedFile);
    mockServer.emit("unlink", addedFile);
    mockServer.emit("add", renamedFile);
    expect(readRegistryEntries(previewPlugin).map((entry) => entry.relativePath)).toEqual([
      "AnimatedSlot.tsx",
      "RenamedSlot.tsx",
    ]);

    mockServer.emit("add", path.join(fixtureRoot, "README.md"));
    expect(readRegistryEntries(previewPlugin).map((entry) => entry.relativePath)).toEqual([
      "AnimatedSlot.tsx",
      "RenamedSlot.tsx",
    ]);

    fs.rmSync(renamedFile);
    mockServer.emit("unlink", renamedFile);
    expect(readRegistryEntries(previewPlugin).map((entry) => entry.relativePath)).toEqual(["AnimatedSlot.tsx"]);

    expect(mockServer.moduleGraph.invalidateModule).toHaveBeenCalledTimes(4);
    expect(mockServer.ws.send).toHaveBeenCalledTimes(4);
    expect(mockServer.ws.send).toHaveBeenCalledWith({ type: "full-reload" });
  });

  it("recomputes entry status for ready, ambiguous, and harness-needed edits before forcing reload", () => {
    const { fixtureRoot, sourceRoot } = createFixtureRoot();
    const sourceFile = path.join(sourceRoot, "AnimatedSlot.tsx");
    fs.writeFileSync(sourceFile, 'export function AnimatedSlot() { return <frame />; }\n', "utf8");

    const previewPlugin = createPreviewPlugin(fixtureRoot, sourceRoot);
    const configureServer = getHookHandler(
      previewPlugin && typeof previewPlugin === "object" ? previewPlugin.configureServer : undefined,
    );
    const handleHotUpdate = getHookHandler(
      previewPlugin && typeof previewPlugin === "object" ? previewPlugin.handleHotUpdate : undefined,
    );
    const mockServer = createMockServer();

    configureServer?.call({} as never, mockServer as never);

    expect(readRegistryEntries(previewPlugin)).toEqual(
      expect.arrayContaining([expect.objectContaining({ relativePath: "AnimatedSlot.tsx", status: "ready" })]),
    );

    fs.writeFileSync(
      sourceFile,
      `
        export function Alpha() {
          return <frame />;
        }

        export function Beta() {
          return <frame />;
        }
      `,
      "utf8",
    );
    expect(handleHotUpdate?.call({} as never, { file: sourceFile } as never)).toEqual([]);
    expect(readRegistryEntries(previewPlugin)).toEqual(
      expect.arrayContaining([expect.objectContaining({ relativePath: "AnimatedSlot.tsx", status: "ambiguous" })]),
    );

    fs.writeFileSync(sourceFile, "export const value = 1;\n", "utf8");
    expect(handleHotUpdate?.call({} as never, { file: sourceFile } as never)).toEqual([]);
    expect(readRegistryEntries(previewPlugin)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ relativePath: "AnimatedSlot.tsx", status: "needs-harness" }),
      ]),
    );

    fs.writeFileSync(sourceFile, "export default function AnimatedSlot() { return <frame />; }\n", "utf8");
    expect(handleHotUpdate?.call({} as never, { file: sourceFile } as never)).toEqual([]);
    expect(readRegistryEntries(previewPlugin)).toEqual(
      expect.arrayContaining([expect.objectContaining({ relativePath: "AnimatedSlot.tsx", status: "ready" })]),
    );

    expect(mockServer.moduleGraph.invalidateModule).toHaveBeenCalledTimes(3);
    expect(mockServer.ws.send).toHaveBeenCalledTimes(3);
  });
});
