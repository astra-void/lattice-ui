import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createPreviewEngine } from "@lattice-ui/preview-engine";
import { resolveRealFilePath } from "../../../packages/preview-engine/src/pathUtils";

const temporaryRoots: string[] = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    fs.rmSync(root, { force: true, recursive: true });
  }
});

function createTempPreviewPackage(files: Record<string, string>) {
  const packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lattice-preview-engine-"));
  temporaryRoots.push(packageRoot);

  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = path.join(packageRoot, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, "utf8");
  }

  if (!fs.existsSync(path.join(packageRoot, "package.json"))) {
    fs.writeFileSync(path.join(packageRoot, "package.json"), JSON.stringify({ name: "@fixtures/preview-engine" }), "utf8");
  }

  return {
    packageRoot,
    sourceRoot: path.join(packageRoot, "src"),
  };
}

function createEngineForPackage(
  packageRoot: string,
  sourceRoot: string,
  selectionMode: "compat" | "strict" = "compat",
  transformMode: "strict-fidelity" | "compatibility" | "mocked" | "design-time" = "compatibility",
) {
  return createPreviewEngine({
    projectName: "Fixture Preview",
    selectionMode,
    targets: [
      {
        name: "fixture",
        packageName: "@fixtures/preview-engine",
        packageRoot,
        sourceRoot,
      },
    ],
    transformMode,
  });
}

function sanitizePaths<T>(value: T, packageRoot: string): T {
  const normalizedRoots = new Set([
    packageRoot.replace(/\\/g, "/"),
    resolveRealFilePath(packageRoot).replace(/\\/g, "/"),
    `/private${packageRoot.replace(/\\/g, "/")}`,
  ]);
  const visit = (current: unknown): unknown => {
    if (typeof current === "string") {
      let next = current;
      for (const normalizedRoot of normalizedRoots) {
        next = next.replaceAll(normalizedRoot, "<pkg>");
      }

      next = next.replaceAll("/private<pkg>", "<pkg>");
      return next;
    }

    if (Array.isArray(current)) {
      return current.map(visit);
    }

    if (current && typeof current === "object") {
      return Object.fromEntries(Object.entries(current).map(([key, nextValue]) => [key, visit(nextValue)]));
    }

    return current;
  };

  return visit(value) as T;
}

describe("createPreviewEngine", () => {
  it("keeps legacy-only entries in needs_harness for strict mode and promotes them in compat mode", () => {
    const { packageRoot, sourceRoot } = createTempPreviewPackage({
      "src/Legacy.tsx": `
        export function Legacy() {
          return <frame />;
        }
      `,
    });

    const strictEngine = createEngineForPackage(packageRoot, sourceRoot, "strict");
    const compatEngine = createEngineForPackage(packageRoot, sourceRoot, "compat");

    expect(strictEngine.getWorkspaceIndex().entries[0]).toMatchObject({
      relativePath: "Legacy.tsx",
      renderTarget: {
        kind: "none",
        reason: "missing-explicit-contract",
      },
      selection: {
        kind: "unresolved",
        reason: "missing-explicit-contract",
      },
      status: "needs_harness",
    });

    expect(compatEngine.getWorkspaceIndex().entries[0]).toMatchObject({
      relativePath: "Legacy.tsx",
      renderTarget: {
        exportName: "Legacy",
        kind: "component",
      },
      selection: {
        kind: "compat",
        reason: "basename-match",
      },
      status: "ready",
    });
  });

  it("resolves preview.entry through imported and re-exported symbols", () => {
    const { packageRoot, sourceRoot } = createTempPreviewPackage({
      "src/Showcase.tsx": `
        export function Showcase() {
          return <frame />;
        }
      `,
      "src/ReExport.tsx": `
        import { Showcase } from "./Showcase";

        export { Showcase as ExplicitCard };

        export const preview = {
          entry: Showcase,
          props: {
            checked: true,
          },
          title: "Explicit Card",
        };
      `,
    });

    const engine = createEngineForPackage(packageRoot, sourceRoot, "strict");

    expect(engine.getWorkspaceIndex().entries.find((entry) => entry.relativePath === "ReExport.tsx")).toMatchObject({
      renderTarget: {
        exportName: "ExplicitCard",
        kind: "component",
        usesPreviewProps: true,
      },
      selection: {
        contract: "preview.entry",
        kind: "explicit",
      },
      status: "ready",
      title: "Explicit Card",
    });
  });

  it("emits stable workspace and payload protocol snapshots", () => {
    const { packageRoot, sourceRoot } = createTempPreviewPackage({
      "src/Broken.tsx": `
        export function Broken() {
          return <viewportframe />;
        }
      `,
      "src/Harness.tsx": `
        export const preview = {
          render: () => <frame />,
          title: "Harness Demo",
        };
      `,
    });

    const engine = createEngineForPackage(packageRoot, sourceRoot, "compat");
    const workspaceSnapshot = sanitizePaths(engine.getWorkspaceIndex(), packageRoot);
    const payloadSnapshot = sanitizePaths(engine.getEntryPayload("fixture:Broken.tsx"), packageRoot);

    expect(workspaceSnapshot).toMatchInlineSnapshot(`
      {
        "entries": [
          {
            "candidateExportNames": [
              "Broken",
            ],
            "capabilities": {
              "supportsHotUpdate": true,
              "supportsLayoutDebug": true,
              "supportsPropsEditing": true,
              "supportsRuntimeMock": true,
            },
            "diagnosticsSummary": {
              "byPhase": {
                "discovery": 1,
                "layout": 0,
                "runtime": 0,
                "transform": 1,
              },
              "hasBlocking": false,
              "total": 2,
            },
            "hasDefaultExport": false,
            "hasPreviewExport": false,
            "id": "fixture:Broken.tsx",
            "packageName": "@fixtures/preview-engine",
            "relativePath": "Broken.tsx",
            "renderTarget": {
              "exportName": "Broken",
              "kind": "component",
              "usesPreviewProps": false,
            },
            "selection": {
              "kind": "compat",
              "reason": "basename-match",
            },
            "sourceFilePath": "<pkg>/src/Broken.tsx",
            "status": "ready",
            "targetName": "fixture",
            "title": "Broken",
          },
          {
            "candidateExportNames": [],
            "capabilities": {
              "supportsHotUpdate": true,
              "supportsLayoutDebug": true,
              "supportsPropsEditing": false,
              "supportsRuntimeMock": true,
            },
            "diagnosticsSummary": {
              "byPhase": {
                "discovery": 0,
                "layout": 0,
                "runtime": 0,
                "transform": 0,
              },
              "hasBlocking": false,
              "total": 0,
            },
            "hasDefaultExport": false,
            "hasPreviewExport": true,
            "id": "fixture:Harness.tsx",
            "packageName": "@fixtures/preview-engine",
            "relativePath": "Harness.tsx",
            "renderTarget": {
              "contract": "preview.render",
              "kind": "harness",
            },
            "selection": {
              "contract": "preview.render",
              "kind": "explicit",
            },
            "sourceFilePath": "<pkg>/src/Harness.tsx",
            "status": "ready",
            "targetName": "fixture",
            "title": "Harness Demo",
          },
        ],
        "projectName": "Fixture Preview",
        "protocolVersion": 2,
        "targets": [
          {
            "name": "fixture",
            "packageName": "@fixtures/preview-engine",
            "packageRoot": "<pkg>",
            "sourceRoot": "<pkg>/src",
          },
        ],
      }
    `);

    expect(payloadSnapshot).toMatchInlineSnapshot(`
      {
        "descriptor": {
          "candidateExportNames": [
            "Broken",
          ],
          "capabilities": {
            "supportsHotUpdate": true,
            "supportsLayoutDebug": true,
            "supportsPropsEditing": true,
            "supportsRuntimeMock": true,
          },
          "diagnosticsSummary": {
            "byPhase": {
              "discovery": 1,
              "layout": 0,
              "runtime": 0,
              "transform": 1,
            },
            "hasBlocking": false,
            "total": 2,
          },
          "hasDefaultExport": false,
          "hasPreviewExport": false,
          "id": "fixture:Broken.tsx",
          "packageName": "@fixtures/preview-engine",
          "relativePath": "Broken.tsx",
          "renderTarget": {
            "exportName": "Broken",
            "kind": "component",
            "usesPreviewProps": false,
          },
          "selection": {
            "kind": "compat",
            "reason": "basename-match",
          },
          "sourceFilePath": "<pkg>/src/Broken.tsx",
          "status": "ready",
          "targetName": "fixture",
          "title": "Broken",
        },
        "diagnostics": [
          {
            "code": "LEGACY_AUTO_RENDER_FALLBACK",
            "entryId": "fixture:Broken.tsx",
            "file": "<pkg>/src/Broken.tsx",
            "phase": "discovery",
            "relativeFile": "src/Broken.tsx",
            "severity": "warning",
            "summary": "This entry still relies on legacy export inference (basename-match). Add \`preview.entry\` or \`preview.render\` to make preview selection explicit.",
            "target": "preview-engine",
          },
          {
            "blocking": false,
            "code": "UNSUPPORTED_HOST_ELEMENT",
            "entryId": "fixture:Broken.tsx",
            "file": "<pkg>/src/Broken.tsx",
            "phase": "transform",
            "relativeFile": "src/Broken.tsx",
            "severity": "warning",
            "summary": "Host element viewportframe is not supported by preview generation.",
            "symbol": "viewportframe",
            "target": "fixture",
          },
        ],
        "graphTrace": {
          "boundaryHops": [],
          "imports": [],
          "selection": {
            "importChain": [
              "<pkg>/src/Broken.tsx",
            ],
            "resolvedExportName": "Broken",
            "symbolChain": [
              "<pkg>/src/Broken.tsx#Broken",
            ],
          },
        },
        "protocolVersion": 2,
        "runtimeAdapter": {
          "kind": "react-dom",
          "moduleId": "virtual:lattice-preview-runtime",
        },
        "transform": {
          "mode": "compatibility",
          "outcome": {
            "fidelity": "degraded",
            "kind": "compatibility",
          },
        },
      }
    `);
  });

  it("keeps compatibility-mode transform diagnostics non-blocking in the workspace index", () => {
    const { packageRoot, sourceRoot } = createTempPreviewPackage({
      "src/Broken.tsx": `
        export function Broken() {
          return <viewportframe />;
        }
      `,
    });

    const engine = createEngineForPackage(packageRoot, sourceRoot, "compat", "compatibility");

    expect(engine.getWorkspaceIndex().entries[0]).toMatchObject({
      relativePath: "Broken.tsx",
      status: "ready",
    });
    expect(engine.getEntryPayload("fixture:Broken.tsx")).toMatchObject({
      descriptor: {
        status: "ready",
      },
      transform: {
        mode: "compatibility",
        outcome: {
          kind: "compatibility",
        },
      },
    });
  });

  it("promotes transform blocking only in strict-fidelity mode", () => {
    const { packageRoot, sourceRoot } = createTempPreviewPackage({
      "src/Broken.tsx": `
        export function Broken() {
          return <viewportframe />;
        }
      `,
    });

    const engine = createEngineForPackage(packageRoot, sourceRoot, "compat", "strict-fidelity");

    expect(engine.getWorkspaceIndex().entries[0]).toMatchObject({
      relativePath: "Broken.tsx",
      status: "blocked_by_transform",
    });
    expect(engine.getEntryPayload("fixture:Broken.tsx")).toMatchObject({
      descriptor: {
        status: "blocked_by_transform",
      },
      transform: {
        mode: "strict-fidelity",
        outcome: {
          kind: "blocked",
        },
      },
    });
  });

  it("reports entry-scoped invalidation updates without requiring full reload", () => {
    const { packageRoot, sourceRoot } = createTempPreviewPackage({
      "src/AnimatedSlot.tsx": `
        export function AnimatedSlot() {
          return <frame />;
        }
      `,
    });

    const engine = createEngineForPackage(packageRoot, sourceRoot, "compat");
    const sourceFile = path.join(sourceRoot, "AnimatedSlot.tsx");

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

    const update = engine.invalidateFiles([sourceFile]);

    expect(update).toMatchObject({
      changedEntryIds: ["fixture:AnimatedSlot.tsx"],
      requiresFullReload: false,
      workspaceChanged: true,
    });
    expect(update.workspaceIndex.entries[0]).toMatchObject({
      renderTarget: {
        kind: "none",
        reason: "ambiguous-exports",
      },
      status: "ambiguous",
    });
  });
});
