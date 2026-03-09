import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { discoverPreviewProject, discoverPreviewWorkspace } from "../../../packages/preview/src/source/discover";

const fixtureRoot = path.resolve(__dirname, "fixtures/source-preview");
const fixtureSourceRoot = path.join(fixtureRoot, "src");
const checkboxPackageRoot = path.resolve(__dirname, "../../../packages/checkbox");
const previewPackageRoot = path.resolve(__dirname, "../../../packages/preview");
const temporaryRoots: string[] = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    fs.rmSync(root, { force: true, recursive: true });
  }
});

function createTempPreviewPackage(files: Record<string, string>) {
  const packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lattice-preview-discover-"));
  temporaryRoots.push(packageRoot);

  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = path.join(packageRoot, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, "utf8");
  }

  if (!fs.existsSync(path.join(packageRoot, "package.json"))) {
    fs.writeFileSync(path.join(packageRoot, "package.json"), JSON.stringify({ name: "@fixtures/temp-preview" }), "utf8");
  }

  return {
    packageRoot,
    sourceRoot: path.join(packageRoot, "src"),
  };
}

describe("discoverPreviewProject", () => {
  it("indexes source-first entries and distinguishes ready and harness-needed states", () => {
    const project = discoverPreviewProject({
      packageName: "@fixtures/source-preview",
      packageRoot: fixtureRoot,
      sourceRoot: fixtureSourceRoot,
    });

    const checkboxEntry = project.entries.find((entry) => entry.relativePath === "CheckboxRoot.tsx");
    const dialogEntry = project.entries.find((entry) => entry.relativePath === "DialogRoot.tsx");
    const ambiguousEntry = project.entries.find((entry) => entry.relativePath === "Ambiguous.tsx");
    const brokenEntry = project.entries.find((entry) => entry.relativePath === "Broken.tsx");
    const nestedEntry = project.entries.find((entry) => entry.relativePath === "NestedEntry.tsx");

    expect(project.entries.map((entry) => entry.relativePath)).toEqual([
      "Ambiguous.tsx",
      "Broken.tsx",
      "CheckboxRoot.tsx",
      "DialogRoot.tsx",
      "NestedEntry.tsx",
    ]);

    expect(checkboxEntry).toMatchObject({
      autoRenderCandidate: "CheckboxRoot",
      autoRenderReason: "basename-match",
      candidateExportNames: ["CheckboxRoot"],
      discoveryDiagnostics: [],
      status: "ready",
      render: {
        exportName: "CheckboxRoot",
        mode: "auto",
        selectedBy: "basename-match",
        usesPreviewProps: false,
      },
    });

    expect(dialogEntry).toMatchObject({
      discoveryDiagnostics: [],
      hasPreviewExport: true,
      status: "ready",
      title: "Dialog Root",
      render: {
        mode: "preview-render",
      },
    });

    expect(ambiguousEntry).toMatchObject({
      candidateExportNames: ["Alpha", "Beta"],
      status: "needs-harness",
      render: {
        mode: "none",
        reason: "ambiguous-exports",
        candidates: ["Alpha", "Beta"],
      },
    });
    expect(ambiguousEntry?.discoveryDiagnostics.map((diagnostic) => diagnostic.code)).toContain(
      "AMBIGUOUS_COMPONENT_EXPORTS",
    );

    expect(brokenEntry?.status).toBe("error");
    expect(brokenEntry?.diagnostics.map((diagnostic) => diagnostic.code)).toContain("UNSUPPORTED_HOST_ELEMENT");
    expect(nestedEntry?.status).toBe("error");
    expect(nestedEntry?.diagnostics.map((diagnostic) => diagnostic.relativeFile)).toContain(
      "src/support/nestedLabel.ts",
    );
  });

  it("emits concrete discover diagnostics for harness-required files", () => {
    const { packageRoot, sourceRoot } = createTempPreviewPackage({
      "src/NoExports.tsx": "export const value = 1;\n",
      "src/PreviewMissingRender.tsx": `
        export const preview = {
          title: "Incomplete Preview",
        };

        export const value = 1;
      `,
    });

    const project = discoverPreviewProject({
      packageName: "@fixtures/harness-diagnostics",
      packageRoot,
      sourceRoot,
    });

    const noExportsEntry = project.entries.find((entry) => entry.relativePath === "NoExports.tsx");
    const previewMissingRenderEntry = project.entries.find((entry) => entry.relativePath === "PreviewMissingRender.tsx");

    expect(noExportsEntry).toMatchObject({
      candidateExportNames: [],
      status: "needs-harness",
      render: {
        mode: "none",
        reason: "no-component-export",
      },
    });
    expect(noExportsEntry?.discoveryDiagnostics.map((diagnostic) => diagnostic.code)).toEqual(["NO_COMPONENT_EXPORTS"]);

    expect(previewMissingRenderEntry).toMatchObject({
      candidateExportNames: [],
      hasPreviewExport: true,
      status: "needs-harness",
      render: {
        mode: "none",
        reason: "no-component-export",
      },
    });
    expect(previewMissingRenderEntry?.discoveryDiagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "NO_COMPONENT_EXPORTS",
      "PREVIEW_RENDER_MISSING",
    ]);
  });

  it("prefers default exports before basename and sole-export auto selection", () => {
    const { packageRoot, sourceRoot } = createTempPreviewPackage({
      "src/CheckboxRoot.tsx": `
        export default function PrimaryCheckboxRoot() {
          return <frame />;
        }

        export function CheckboxRoot() {
          return <frame />;
        }
      `,
      "src/index.tsx": `
        export function SoleFixture() {
          return <frame />;
        }
      `,
    });

    const project = discoverPreviewProject({
      packageName: "@fixtures/selection-priority",
      packageRoot,
      sourceRoot,
    });

    expect(project.entries.find((entry) => entry.relativePath === "CheckboxRoot.tsx")).toMatchObject({
      autoRenderCandidate: "default",
      autoRenderReason: "default",
      candidateExportNames: ["CheckboxRoot"],
      hasDefaultExport: true,
      status: "ready",
      render: {
        mode: "auto",
        exportName: "default",
        selectedBy: "default",
      },
    });

    expect(project.entries.find((entry) => entry.relativePath === "index.tsx")).toMatchObject({
      autoRenderCandidate: "SoleFixture",
      autoRenderReason: "sole-export",
      candidateExportNames: ["SoleFixture"],
      hasDefaultExport: false,
      status: "ready",
      render: {
        mode: "auto",
        exportName: "SoleFixture",
        selectedBy: "sole-export",
      },
    });
  });

  it("prefers basename-matching exports when helper components share the file", () => {
    const { packageRoot, sourceRoot } = createTempPreviewPackage({
      "src/CheckboxRoot.tsx": `
        export function Helper() {
          return <frame />;
        }

        export function CheckboxRoot() {
          return <frame />;
        }
      `,
    });

    const project = discoverPreviewProject({
      packageName: "@fixtures/basename-match",
      packageRoot,
      sourceRoot,
    });

    expect(project.entries.find((entry) => entry.relativePath === "CheckboxRoot.tsx")).toMatchObject({
      autoRenderCandidate: "CheckboxRoot",
      autoRenderReason: "basename-match",
      candidateExportNames: ["CheckboxRoot", "Helper"],
      status: "ready",
      render: {
        mode: "auto",
        exportName: "CheckboxRoot",
        selectedBy: "basename-match",
      },
    });
  });

  it("matches file basenames against aliased export names", () => {
    const { packageRoot, sourceRoot } = createTempPreviewPackage({
      "src/CheckboxRoot.tsx": `
        function Root() {
          return <frame />;
        }

        function Helper() {
          return <frame />;
        }

        export { Root as CheckboxRoot, Helper };
      `,
    });

    const project = discoverPreviewProject({
      packageName: "@fixtures/aliased-basename",
      packageRoot,
      sourceRoot,
    });

    expect(project.entries.find((entry) => entry.relativePath === "CheckboxRoot.tsx")).toMatchObject({
      autoRenderCandidate: "CheckboxRoot",
      autoRenderReason: "basename-match",
      candidateExportNames: ["CheckboxRoot", "Helper"],
      status: "ready",
      render: {
        mode: "auto",
        exportName: "CheckboxRoot",
        selectedBy: "basename-match",
      },
    });
  });

  it("follows tsconfig path aliases that resolve inside the source root", () => {
    const { packageRoot, sourceRoot } = createTempPreviewPackage({
      "tsconfig.json": JSON.stringify(
        {
          compilerOptions: {
            baseUrl: ".",
            paths: {
              "@src/*": ["src/*"],
            },
          },
        },
        null,
        2,
      ),
      "src/AliasNested.tsx": `
        import { unsupportedHost } from "@src/support/unsupported";

        export function AliasNested() {
          return unsupportedHost;
        }
      `,
      "src/support/unsupported.tsx": "export const unsupportedHost = <viewportframe />;\n",
    });

    const project = discoverPreviewProject({
      packageName: "@fixtures/aliased-source",
      packageRoot,
      sourceRoot,
    });

    const aliasEntry = project.entries.find((entry) => entry.relativePath === "AliasNested.tsx");

    expect(aliasEntry?.status).toBe("error");
    expect(aliasEntry?.diagnostics.map((diagnostic) => diagnostic.code)).toContain("UNSUPPORTED_HOST_ELEMENT");
    expect(aliasEntry?.diagnostics.map((diagnostic) => diagnostic.relativeFile)).toContain("src/support/unsupported.tsx");
  });

  it("reports a limitation when aliased imports resolve outside the source root", () => {
    const { packageRoot, sourceRoot } = createTempPreviewPackage({
      "tsconfig.json": JSON.stringify(
        {
          compilerOptions: {
            baseUrl: ".",
            paths: {
              "@shared/*": ["shared/*"],
            },
          },
        },
        null,
        2,
      ),
      "src/AliasOutside.tsx": `
        import { sharedLabel } from "@shared/label";

        export function AliasOutside() {
          return <textlabel Text={sharedLabel} />;
        }
      `,
      "shared/label.ts": 'export const sharedLabel = "Outside source root";\n',
    });

    const project = discoverPreviewProject({
      packageName: "@fixtures/aliased-outside",
      packageRoot,
      sourceRoot,
    });

    const aliasOutsideEntry = project.entries.find((entry) => entry.relativePath === "AliasOutside.tsx");

    expect(aliasOutsideEntry?.status).toBe("ready");
    expect(aliasOutsideEntry?.diagnostics).toEqual([]);
    expect(aliasOutsideEntry?.discoveryDiagnostics.map((diagnostic) => diagnostic.code)).toContain(
      "TRANSITIVE_ANALYSIS_LIMITED",
    );
    expect(aliasOutsideEntry?.discoveryDiagnostics[0]?.message).toContain("@shared/label");
  });

  it("allows context-dependent subcomponents to auto-render without a preview export", () => {
    const project = discoverPreviewProject({
      packageName: "@lattice-ui/checkbox",
      packageRoot: checkboxPackageRoot,
      sourceRoot: path.join(checkboxPackageRoot, "src"),
    });

    expect(project.entries.find((entry) => entry.relativePath === "Checkbox/CheckboxRoot.tsx")).toMatchObject({
      autoRenderReason: "basename-match",
      status: "ready",
      render: {
        exportName: "CheckboxRoot",
        mode: "auto",
        selectedBy: "basename-match",
      },
    });

    expect(project.entries.find((entry) => entry.relativePath === "Checkbox/CheckboxIndicator.tsx")).toMatchObject({
      autoRenderReason: "basename-match",
      status: "ready",
      render: {
        exportName: "CheckboxIndicator",
        mode: "auto",
        selectedBy: "basename-match",
        usesPreviewProps: false,
      },
    });
  });

  it("hides preview package shell and runtime internals from the entry list", () => {
    const project = discoverPreviewProject({
      packageName: "@lattice-ui/preview",
      packageRoot: previewPackageRoot,
      sourceRoot: path.join(previewPackageRoot, "src"),
    });

    expect(project.entries).toEqual([]);
  });

  it("ignores ambient declaration files when indexing a source root", () => {
    const { packageRoot, sourceRoot } = createTempPreviewPackage({
      "src/index.tsx": 'export function AmbientFixture() { return <frame Text="ok" />; }\n',
      "src/external-modules.d.ts": 'declare module "virtual:fixture" { export const value: string; }\n',
    });

    const project = discoverPreviewProject({
      packageName: "@fixtures/ambient",
      packageRoot,
      sourceRoot,
    });

    expect(project.entries.map((entry) => entry.relativePath)).toEqual(["index.tsx"]);
  });
});

describe("discoverPreviewWorkspace", () => {
  it("combines explicit targets into one registry", () => {
    const workspace = discoverPreviewWorkspace({
      projectName: "Fixture Preview",
      targets: [
        {
          name: "fixture",
          packageName: "@fixtures/source-preview",
          packageRoot: fixtureRoot,
          sourceRoot: fixtureSourceRoot,
        },
        {
          name: "unsupported",
          packageName: "@fixtures/unsupported",
          packageRoot: path.resolve(__dirname, "fixtures/unsupported"),
          sourceRoot: path.resolve(__dirname, "fixtures/unsupported/src"),
        },
      ],
    });

    expect(workspace.projectName).toBe("Fixture Preview");
    expect(workspace.entries.some((entry) => entry.id === "fixture:CheckboxRoot.tsx")).toBe(true);
    expect(workspace.entries.some((entry) => entry.id === "unsupported:index.tsx")).toBe(true);
    expect(workspace.entries.find((entry) => entry.id === "fixture:CheckboxRoot.tsx")).toMatchObject({
      packageName: "@fixtures/source-preview",
      relativePath: "CheckboxRoot.tsx",
      targetName: "fixture",
    });
  });
});
