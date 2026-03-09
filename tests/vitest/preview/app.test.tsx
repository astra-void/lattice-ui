// @vitest-environment jsdom

import path from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PreviewApp } from "../../../packages/preview/src/shell/PreviewApp";
import { PreviewThemeProvider } from "../../../packages/preview/src/shell/theme";
import { discoverPreviewProject } from "../../../packages/preview/src/source/discover";

afterEach(() => {
  cleanup();
});

const fixtureRoot = path.resolve(__dirname, "fixtures/source-preview");
const checkboxPackageRoot = path.resolve(__dirname, "../../../packages/checkbox");
const checkboxEntry = discoverPreviewProject({
  packageName: "@lattice-ui/checkbox",
  packageRoot: checkboxPackageRoot,
  sourceRoot: path.join(checkboxPackageRoot, "src"),
}).entries.find((entry) => entry.relativePath === "Checkbox/CheckboxRoot.tsx");
const dialogEntry = discoverPreviewProject({
  packageName: "@fixtures/source-preview",
  packageRoot: fixtureRoot,
  sourceRoot: path.join(fixtureRoot, "src"),
}).entries.find((entry) => entry.relativePath === "DialogRoot.tsx");

function createLoadedEntry(module: Record<string, unknown>, diagnostics: Array<Record<string, unknown>> = []) {
  return Promise.resolve({
    meta: {
      diagnostics,
    },
    module,
  });
}

function createReadyEntry(id: string, title: string) {
  return {
    autoRenderCandidate: "default" as const,
    autoRenderReason: "default" as const,
    candidateExportNames: [],
    discoveryDiagnostics: [],
    exportNames: ["default"],
    hasDefaultExport: true,
    hasPreviewExport: false,
    id,
    packageName: "@fixtures/preview-shell",
    relativePath: id,
    render: {
      exportName: "default" as const,
      mode: "auto" as const,
      selectedBy: "default" as const,
      usesPreviewProps: false,
    },
    sourceFilePath: `/virtual/${id}`,
    status: "ready" as const,
    targetName: "fixture",
    title,
  };
}

function renderPreviewApp(app: React.ReactElement) {
  return render(<PreviewThemeProvider>{app}</PreviewThemeProvider>);
}

describe("preview shell", () => {
  it("renders direct-export preview entries", async () => {
    if (!checkboxEntry) {
      throw new Error("Expected checkbox preview entry to be discoverable.");
    }

    renderPreviewApp(
      <PreviewApp
        entries={[checkboxEntry]}
        initialSelectedId={checkboxEntry.id}
        loadEntry={() =>
          createLoadedEntry({
            CheckboxRoot: () => <button type="button">Unchecked</button>,
          })
        }
        projectName="@lattice-ui/preview-smoke"
      />,
    );

    expect(await screen.findByRole("button", { name: /unchecked/i })).toBeTruthy();
  });

  it("renders harness-based previews from the preview export contract", async () => {
    if (!dialogEntry) {
      throw new Error("Expected dialog preview entry to be discoverable.");
    }

    renderPreviewApp(
      <PreviewApp
        entries={[dialogEntry]}
        initialSelectedId={dialogEntry.id}
        loadEntry={() =>
          createLoadedEntry({
            preview: {
              render: () => (
                <div>
                  <p>Dialog Preview</p>
                  <button type="button">Close</button>
                </div>
              ),
            },
          })
        }
        projectName="@lattice-ui/preview-smoke"
      />,
    );

    expect(await screen.findByText("Dialog Preview")).toBeTruthy();
    expect(screen.getByRole("button", { name: /close/i })).toBeTruthy();
  });

  it("shows compatibility-mode transform diagnostics without blocking the preview", async () => {
    renderPreviewApp(
      <PreviewApp
        entries={[
          {
            autoRenderCandidate: "Broken",
            autoRenderReason: "sole-export",
            candidateExportNames: ["Broken"],
            discoveryDiagnostics: [],
            exportNames: ["Broken"],
            hasDefaultExport: false,
            hasPreviewExport: false,
            id: "Broken.tsx",
            packageName: "@fixtures/broken",
            relativePath: "Broken.tsx",
            render: {
              exportName: "Broken",
              mode: "auto",
              selectedBy: "sole-export",
              usesPreviewProps: false,
            },
            sourceFilePath: "/virtual/Broken.tsx",
            status: "ready",
            targetName: "broken",
            title: "Broken",
          },
        ]}
        initialSelectedId="Broken.tsx"
        loadEntry={() =>
          createLoadedEntry(
            {
              Broken: () => <button type="button">Broken preview</button>,
            },
            [
              {
                blocking: false,
                code: "UNSUPPORTED_GLOBAL",
                column: 3,
                file: "/virtual/Broken.tsx",
                line: 2,
                message: "The Roblox `game` global is not supported by preview generation.",
                severity: "warning",
                relativeFile: "src/Broken.tsx",
                summary: "The Roblox `game` global is not supported by preview generation.",
                target: "roblox",
              },
            ],
          )
        }
        projectName="@lattice-ui/preview-smoke"
      />,
    );

    expect(await screen.findByRole("button", { name: "Broken preview" })).toBeTruthy();
    expect(screen.getByText("UNSUPPORTED_GLOBAL")).toBeTruthy();
  });

  it("shows blocked-by-transform guidance without rendering the canvas", async () => {
    const loadEntry = vi.fn(() =>
      createLoadedEntry(
        {},
        [
          {
            blocking: true,
            code: "UNSUPPORTED_HOST_ELEMENT",
            column: 1,
            file: "/virtual/Blocked.tsx",
            line: 1,
            message: "Host element viewportframe is not supported by preview generation.",
            relativeFile: "src/Blocked.tsx",
            severity: "error",
            summary: "Host element viewportframe is not supported by preview generation.",
            target: "fixture",
          },
        ],
      ),
    );

    renderPreviewApp(
      <PreviewApp
        entries={[
          {
            autoRenderCandidate: "Blocked",
            autoRenderReason: "sole-export",
            candidateExportNames: ["Blocked"],
            discoveryDiagnostics: [],
            exportNames: ["Blocked"],
            hasDefaultExport: false,
            hasPreviewExport: false,
            id: "Blocked.tsx",
            packageName: "@fixtures/blocked",
            relativePath: "Blocked.tsx",
            render: {
              exportName: "Blocked",
              mode: "auto",
              selectedBy: "sole-export",
              usesPreviewProps: false,
            },
            sourceFilePath: "/virtual/Blocked.tsx",
            status: "blocked_by_transform",
            targetName: "fixture",
            title: "Blocked",
          },
        ]}
        initialSelectedId="Blocked.tsx"
        loadEntry={loadEntry}
        projectName="@lattice-ui/preview-smoke"
      />,
    );

    expect(await screen.findByText("This preview is blocked by transform mode.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Blocked preview" })).toBeNull();
    expect(loadEntry).toHaveBeenCalledTimes(1);
  });

  it("shows harness guidance without loading modules for non-previewable entries", () => {
    const loadEntry = vi.fn(() => Promise.reject(new Error("should not load")));

    renderPreviewApp(
      <PreviewApp
        entries={[
          {
            candidateExportNames: [],
            discoveryDiagnostics: [
              {
                code: "PREVIEW_RENDER_MISSING",
                file: "/virtual/CheckboxIndicator.tsx",
                message: "The file exports `preview`, but it does not define a usable `preview.entry` or callable `preview.render`.",
                relativeFile: "src/Checkbox/CheckboxIndicator.tsx",
              },
            ],
            exportNames: ["CheckboxIndicator"],
            hasDefaultExport: false,
            hasPreviewExport: true,
            id: "Checkbox/CheckboxIndicator.tsx",
            packageName: "@lattice-ui/checkbox",
            relativePath: "Checkbox/CheckboxIndicator.tsx",
            render: {
              mode: "none",
              reason: "no-component-export",
            },
            sourceFilePath: "/virtual/CheckboxIndicator.tsx",
            status: "needs-harness",
            targetName: "checkbox",
            title: "Checkbox Indicator",
          },
        ]}
        initialSelectedId="Checkbox/CheckboxIndicator.tsx"
        loadEntry={loadEntry}
        projectName="@lattice-ui/preview-smoke"
      />,
    );

    expect(screen.getByText("The preview export is incomplete.")).toBeTruthy();
    expect(screen.getByText("PREVIEW_RENDER_MISSING")).toBeTruthy();
    expect(loadEntry).not.toHaveBeenCalled();
  });

  it("shows ambiguous guidance with concrete candidates", () => {
    const loadEntry = vi.fn(() => Promise.reject(new Error("should not load")));

    renderPreviewApp(
      <PreviewApp
        entries={[
          {
            candidateExportNames: ["Alpha", "Beta"],
            discoveryDiagnostics: [
              {
                code: "AMBIGUOUS_COMPONENT_EXPORTS",
                file: "/virtual/Ambiguous.tsx",
                message: "Multiple component exports need explicit disambiguation: Alpha, Beta.",
                relativeFile: "src/Ambiguous.tsx",
              },
            ],
            exportNames: ["Alpha", "Beta"],
            hasDefaultExport: false,
            hasPreviewExport: false,
            id: "Ambiguous.tsx",
            packageName: "@fixtures/ambiguous",
            relativePath: "Ambiguous.tsx",
            render: {
              mode: "none",
              reason: "ambiguous-exports",
              candidates: ["Alpha", "Beta"],
            },
            sourceFilePath: "/virtual/Ambiguous.tsx",
            status: "needs-harness",
            targetName: "fixture",
            title: "Ambiguous",
          },
        ]}
        initialSelectedId="Ambiguous.tsx"
        loadEntry={loadEntry}
        projectName="@lattice-ui/preview-smoke"
      />,
    );

    expect(screen.getByText("Multiple exported components match this file.")).toBeTruthy();
    expect(screen.getByText(/Automatic selection found multiple component exports: Alpha, Beta\./)).toBeTruthy();
    expect(screen.getByText("AMBIGUOUS_COMPONENT_EXPORTS")).toBeTruthy();
    expect(loadEntry).not.toHaveBeenCalled();
  });

  it("shows no-component guidance without falling back to ambiguous messaging", () => {
    const loadEntry = vi.fn(() => Promise.reject(new Error("should not load")));

    renderPreviewApp(
      <PreviewApp
        entries={[
          {
            candidateExportNames: [],
            discoveryDiagnostics: [
              {
                code: "NO_COMPONENT_EXPORTS",
                file: "/virtual/HarnessOnly.tsx",
                message: "No exported component candidates were found for auto-render.",
                relativeFile: "src/HarnessOnly.tsx",
              },
            ],
            exportNames: [],
            hasDefaultExport: false,
            hasPreviewExport: false,
            id: "HarnessOnly.tsx",
            packageName: "@fixtures/harness-only",
            relativePath: "HarnessOnly.tsx",
            render: {
              mode: "none",
              reason: "no-component-export",
            },
            sourceFilePath: "/virtual/HarnessOnly.tsx",
            status: "needs-harness",
            targetName: "fixture",
            title: "Harness Only",
          },
        ]}
        initialSelectedId="HarnessOnly.tsx"
        loadEntry={loadEntry}
        projectName="@lattice-ui/preview-smoke"
      />,
    );

    expect(screen.getByText("This file is not directly previewable yet.")).toBeTruthy();
    expect(screen.getByText("No renderable exported component was found. Add `preview.entry` or `preview.render` for composed demos.")).toBeTruthy();
    expect(loadEntry).not.toHaveBeenCalled();
  });

  it("shows an empty-project state when there are no eligible preview entries", () => {
    renderPreviewApp(
      <PreviewApp entries={[]} loadEntry={() => Promise.reject(new Error("should not load"))} projectName="Empty" />,
    );

    expect(screen.getByText("No previewable source files were found.")).toBeTruthy();
  });

  it("clears load errors when the user selects another ready entry", async () => {
    const user = userEvent.setup();
    const brokenEntry = createReadyEntry("Broken.tsx", "Broken");
    const workingEntry = createReadyEntry("Working.tsx", "Working");

    renderPreviewApp(
      <PreviewApp
        entries={[brokenEntry, workingEntry]}
        initialSelectedId={brokenEntry.id}
        loadEntry={(id) =>
          id === brokenEntry.id
            ? Promise.reject(new Error("Intentional load failure."))
            : createLoadedEntry({
                default: () => <button type="button">Healthy preview</button>,
              })
        }
        projectName="@lattice-ui/preview-smoke"
      />,
    );

    expect(await screen.findByText("Preview module failed to load.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /working/i }));
    expect(await screen.findByRole("button", { name: "Healthy preview" })).toBeTruthy();
  });

  it("clears render errors when the user switches to another entry", async () => {
    const user = userEvent.setup();
    const crashingEntry = createReadyEntry("Crash.tsx", "Crash");
    const workingEntry = createReadyEntry("Okay.tsx", "Okay");

    renderPreviewApp(
      <PreviewApp
        entries={[crashingEntry, workingEntry]}
        initialSelectedId={crashingEntry.id}
        loadEntry={(id) =>
          createLoadedEntry({
            default:
              id === crashingEntry.id
                ? () => {
                    throw new Error("Intentional render failure.");
                  }
                : () => <button type="button">Recovered preview</button>,
          })
        }
        projectName="@lattice-ui/preview-smoke"
      />,
    );

    expect(await screen.findByText("Preview render failed.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /okay/i }));
    expect(await screen.findByRole("button", { name: "Recovered preview" })).toBeTruthy();
  });

  it("renders the sole component export when a hot update leaves the registry export name stale", async () => {
    renderPreviewApp(
      <PreviewApp
        entries={[
          {
            autoRenderCandidate: "LoadoutEditor",
            autoRenderReason: "sole-export",
            candidateExportNames: ["LoadoutEditor"],
            discoveryDiagnostics: [],
            exportNames: ["LoadoutEditor"],
            hasDefaultExport: false,
            hasPreviewExport: false,
            id: "LoadoutEditor.tsx",
            packageName: "@fixtures/stale-registry",
            relativePath: "LoadoutEditor.tsx",
            render: {
              exportName: "LoadoutEditor",
              mode: "auto",
              selectedBy: "sole-export",
              usesPreviewProps: false,
            },
            sourceFilePath: "/virtual/LoadoutEditor.tsx",
            status: "ready",
            targetName: "fixture",
            title: "Loadout Editor",
          },
        ]}
        initialSelectedId="LoadoutEditor.tsx"
        loadEntry={() =>
          createLoadedEntry({
            AnimatedSlot: () => <button type="button">Recovered stale export</button>,
          })
        }
        projectName="@lattice-ui/preview-smoke"
      />,
    );

    expect(await screen.findByRole("button", { name: "Recovered stale export" })).toBeTruthy();
    expect(screen.queryByText("Preview render failed.")).toBeNull();
  });
});
