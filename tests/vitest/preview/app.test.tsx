// @vitest-environment jsdom

import path from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PreviewApp } from "../../../packages/preview/src/shell/PreviewApp";
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

function createReadyEntry(id: string, title: string) {
  return {
    diagnostics: [],
    exportNames: ["default"],
    hasDefaultExport: true,
    hasPreviewExport: false,
    id,
    packageName: "@fixtures/preview-shell",
    relativePath: id,
    render: {
      exportName: "default" as const,
      mode: "auto" as const,
      usesPreviewProps: false,
    },
    sourceFilePath: `/virtual/${id}`,
    status: "ready" as const,
    targetName: "fixture",
    title,
  };
}

describe("preview shell", () => {
  it("renders direct-export preview entries", async () => {
    if (!checkboxEntry) {
      throw new Error("Expected checkbox preview entry to be discoverable.");
    }

    render(
      <PreviewApp
        entries={[checkboxEntry]}
        initialSelectedId={checkboxEntry.id}
        loadModule={() =>
          Promise.resolve({
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

    render(
      <PreviewApp
        entries={[dialogEntry]}
        initialSelectedId={dialogEntry.id}
        loadModule={() =>
          Promise.resolve({
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

  it("shows diagnostics states without crashing the shell", async () => {
    render(
      <PreviewApp
        entries={[
          {
            diagnostics: [
              {
                code: "UNSUPPORTED_GLOBAL",
                column: 3,
                file: "/virtual/Broken.tsx",
                line: 2,
                message: "The Roblox `game` global is not supported by preview generation.",
                relativeFile: "src/Broken.tsx",
                target: "roblox",
              },
            ],
            exportNames: ["Broken"],
            hasDefaultExport: false,
            hasPreviewExport: false,
            id: "Broken.tsx",
            packageName: "@fixtures/broken",
            relativePath: "Broken.tsx",
            render: {
              exportName: "Broken",
              mode: "auto",
              usesPreviewProps: false,
            },
            sourceFilePath: "/virtual/Broken.tsx",
            status: "error",
            targetName: "broken",
            title: "Broken",
          },
        ]}
        initialSelectedId="Broken.tsx"
        loadModule={() => Promise.reject(new Error("should not load"))}
        projectName="@lattice-ui/preview-smoke"
      />,
    );

    expect(screen.getByText("Transform diagnostics are blocking this preview.")).toBeTruthy();
    expect(screen.getByText("UNSUPPORTED_GLOBAL")).toBeTruthy();
  });

  it("shows harness guidance without loading modules for non-previewable entries", () => {
    const loadModule = vi.fn(() => Promise.reject(new Error("should not load")));

    render(
      <PreviewApp
        entries={[
          {
            diagnostics: [],
            exportNames: ["CheckboxIndicator"],
            hasDefaultExport: false,
            hasPreviewExport: false,
            id: "Checkbox/CheckboxIndicator.tsx",
            packageName: "@lattice-ui/checkbox",
            relativePath: "Checkbox/CheckboxIndicator.tsx",
            render: {
              mode: "none",
            },
            sourceFilePath: "/virtual/CheckboxIndicator.tsx",
            status: "needs-harness",
            targetName: "checkbox",
            title: "Checkbox Indicator",
          },
        ]}
        initialSelectedId="Checkbox/CheckboxIndicator.tsx"
        loadModule={loadModule}
        projectName="@lattice-ui/preview-smoke"
      />,
    );

    expect(screen.getByText("This file is not directly previewable yet.")).toBeTruthy();
    expect(loadModule).not.toHaveBeenCalled();
  });

  it("shows an empty-project state when there are no eligible preview entries", () => {
    render(
      <PreviewApp entries={[]} loadModule={() => Promise.reject(new Error("should not load"))} projectName="Empty" />,
    );

    expect(screen.getByText("No previewable source files were found.")).toBeTruthy();
  });

  it("clears load errors when the user selects another ready entry", async () => {
    const user = userEvent.setup();
    const brokenEntry = createReadyEntry("Broken.tsx", "Broken");
    const workingEntry = createReadyEntry("Working.tsx", "Working");

    render(
      <PreviewApp
        entries={[brokenEntry, workingEntry]}
        initialSelectedId={brokenEntry.id}
        loadModule={(id) =>
          id === brokenEntry.id
            ? Promise.reject(new Error("Intentional load failure."))
            : Promise.resolve({
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

    render(
      <PreviewApp
        entries={[crashingEntry, workingEntry]}
        initialSelectedId={crashingEntry.id}
        loadModule={(id) =>
          Promise.resolve({
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
});
