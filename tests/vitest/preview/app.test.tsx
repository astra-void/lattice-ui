// @vitest-environment jsdom

import path from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { discoverPreviewProject } from "../../../packages/preview/src";
import { PreviewApp } from "../../../packages/preview/src/ui/PreviewApp";

afterEach(() => {
  cleanup();
});

const checkboxPackageRoot = path.resolve(__dirname, "../../../packages/checkbox");
const dialogPackageRoot = path.resolve(__dirname, "../../../packages/dialog");
const checkboxEntry = discoverPreviewProject({
  packageName: "@lattice-ui/checkbox",
  packageRoot: checkboxPackageRoot,
  sourceRoot: path.join(checkboxPackageRoot, "src"),
}).entries.find((entry) => entry.relativePath === "Checkbox/CheckboxRoot.tsx");
const dialogEntry = discoverPreviewProject({
  packageName: "@lattice-ui/dialog",
  packageRoot: dialogPackageRoot,
  sourceRoot: path.join(dialogPackageRoot, "src"),
}).entries.find((entry) => entry.relativePath === "Dialog/DialogRoot.tsx");

describe("preview app", () => {
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
});
