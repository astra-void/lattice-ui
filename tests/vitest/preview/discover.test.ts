import path from "node:path";
import { describe, expect, it } from "vitest";
import { discoverPreviewProject, discoverPreviewWorkspace } from "../../../packages/preview/src/source/discover";

const fixtureRoot = path.resolve(__dirname, "fixtures/source-preview");
const fixtureSourceRoot = path.join(fixtureRoot, "src");
const checkboxPackageRoot = path.resolve(__dirname, "../../../packages/checkbox");
const previewPackageRoot = path.resolve(__dirname, "../../../packages/preview");

describe("discoverPreviewProject", () => {
  it("indexes source-first entries with auto render, harness, and diagnostics states", () => {
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
      status: "ready",
      render: {
        exportName: "CheckboxRoot",
        mode: "auto",
        usesPreviewProps: false,
      },
    });

    expect(dialogEntry).toMatchObject({
      hasPreviewExport: true,
      status: "ready",
      title: "Dialog Root",
      render: {
        mode: "preview-render",
      },
    });

    expect(ambiguousEntry).toMatchObject({
      status: "needs-harness",
      render: {
        mode: "none",
      },
    });

    expect(brokenEntry?.status).toBe("error");
    expect(brokenEntry?.diagnostics.map((diagnostic) => diagnostic.code)).toContain("UNSUPPORTED_GLOBAL");

    expect(nestedEntry?.status).toBe("error");
    expect(nestedEntry?.diagnostics.map((diagnostic) => diagnostic.relativeFile)).toContain(
      "src/support/nestedLabel.ts",
    );
  });

  it("allows context-dependent subcomponents to auto-render without a preview export", () => {
    const project = discoverPreviewProject({
      packageName: "@lattice-ui/checkbox",
      packageRoot: checkboxPackageRoot,
      sourceRoot: path.join(checkboxPackageRoot, "src"),
    });

    expect(project.entries.find((entry) => entry.relativePath === "Checkbox/CheckboxRoot.tsx")).toMatchObject({
      status: "ready",
      render: {
        exportName: "CheckboxRoot",
        mode: "auto",
      },
    });

    expect(project.entries.find((entry) => entry.relativePath === "Checkbox/CheckboxIndicator.tsx")).toMatchObject({
      status: "ready",
      render: {
        exportName: "CheckboxIndicator",
        mode: "auto",
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
