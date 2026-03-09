import { previewImporters, previewWorkspaceIndex } from "virtual:lattice-preview-workspace-index";
import type {
  PreviewDiagnostic,
  PreviewEngineUpdate,
  PreviewAutoRenderSelectionReason as EngineAutoRenderSelectionReason,
  PreviewEntryDescriptor,
  PreviewEntryPayload,
} from "@lattice-ui/preview-engine";
import React from "react";
import type { PreviewAutoRenderSelectionReason, PreviewEntryMeta, PreviewRegistryItem } from "../source/types";
import { PreviewApp } from "./PreviewApp";

type HotContext = {
  off?: (event: string, callback: (update: PreviewEngineUpdate) => void) => void;
  on: (event: string, callback: (update: PreviewEngineUpdate) => void) => void;
};

function getHotContext(): HotContext | undefined {
  try {
    return Function("return import.meta.hot")() as HotContext | undefined;
  } catch {
    return undefined;
  }
}

function mapSelectionReason(reason: EngineAutoRenderSelectionReason): PreviewAutoRenderSelectionReason {
  switch (reason) {
    case "basename-match":
      return "basename-match";
    case "sole-export":
      return "sole-export";
    case "default":
    default:
      return "default";
  }
}

function createDiscoveryDiagnostics(entry: PreviewEntryDescriptor) {
  if (entry.selection.kind === "compat") {
    return [
      {
        code: "LEGACY_AUTO_RENDER_FALLBACK" as const,
        file: entry.sourceFilePath,
        message:
          `This entry still relies on legacy export inference (${entry.selection.reason}). ` +
          "Add `preview.entry` or `preview.render` to make preview selection explicit.",
        relativeFile: entry.relativePath,
      },
    ];
  }

  if (entry.renderTarget.kind !== "none") {
    return [];
  }

  switch (entry.renderTarget.reason) {
    case "ambiguous-exports":
      return [
        {
          code: "AMBIGUOUS_COMPONENT_EXPORTS" as const,
          file: entry.sourceFilePath,
          message: `Multiple component exports need explicit disambiguation: ${entry.candidateExportNames.join(", ")}.`,
          relativeFile: entry.relativePath,
        },
      ];
    case "missing-explicit-contract":
      return [
        {
          code: "MISSING_EXPLICIT_PREVIEW_CONTRACT" as const,
          file: entry.sourceFilePath,
          message: "Add `preview.entry` or `preview.render` to make the preview target explicit.",
          relativeFile: entry.relativePath,
        },
      ];
    case "no-component-export":
    default:
      return [
        {
          code: "NO_COMPONENT_EXPORTS" as const,
          file: entry.sourceFilePath,
          message: "No exported component candidates were found for preview entry selection.",
          relativeFile: entry.relativePath,
        },
      ];
  }
}

function mapEntry(entry: PreviewEntryDescriptor): PreviewRegistryItem {
  const render =
    entry.renderTarget.kind === "harness"
      ? ({
          mode: "preview-render",
        } as const)
      : entry.renderTarget.kind === "component"
        ? entry.selection.kind === "compat"
          ? ({
              exportName: entry.renderTarget.exportName,
              mode: "auto",
              selectedBy: mapSelectionReason(entry.selection.reason),
              usesPreviewProps: entry.renderTarget.usesPreviewProps,
            } as const)
          : ({
              exportName: entry.renderTarget.exportName,
              mode: "preview-entry",
              usesPreviewProps: entry.renderTarget.usesPreviewProps,
            } as const)
        : ({
            candidates: entry.renderTarget.candidates,
            mode: "none",
            reason: entry.renderTarget.reason === "ambiguous-exports" ? "ambiguous-exports" : "no-component-export",
          } as const);

  return {
    autoRenderCandidate:
      entry.selection.kind === "compat" && entry.renderTarget.kind === "component"
        ? entry.renderTarget.exportName
        : undefined,
    autoRenderReason: entry.selection.kind === "compat" ? mapSelectionReason(entry.selection.reason) : undefined,
    candidateExportNames: entry.candidateExportNames,
    discoveryDiagnostics: createDiscoveryDiagnostics(entry),
    exportNames: entry.hasDefaultExport ? ["default", ...entry.candidateExportNames] : [...entry.candidateExportNames],
    hasDefaultExport: entry.hasDefaultExport,
    hasPreviewExport: entry.hasPreviewExport,
    id: entry.id,
    packageName: entry.packageName,
    relativePath: entry.relativePath,
    render,
    sourceFilePath: entry.sourceFilePath,
    status:
      entry.status === "needs_harness"
        ? "needs-harness"
        : entry.status === "ambiguous"
          ? "ambiguous"
          : entry.status,
    targetName: entry.targetName,
    title: entry.title,
  };
}

function mapRuntimeDiagnostics(payload: PreviewEntryPayload): PreviewEntryMeta {
  return {
    diagnostics: payload.diagnostics.filter((diagnostic) => diagnostic.phase !== "discovery").map(mapDiagnostic),
  };
}

function mapDiagnostic(diagnostic: PreviewDiagnostic) {
  return {
    blocking: diagnostic.blocking,
    code: diagnostic.code,
    column: 1,
    file: diagnostic.file,
    line: 1,
    message: diagnostic.summary,
    phase: diagnostic.phase,
    relativeFile: diagnostic.relativeFile,
    severity: diagnostic.severity,
    summary: diagnostic.summary,
    symbol: diagnostic.symbol,
    target: diagnostic.target,
  };
}

export function PreviewWorkspaceApp() {
  const [entries, setEntries] = React.useState(() => previewWorkspaceIndex.entries.map(mapEntry));

  React.useEffect(() => {
    const hot = getHotContext();
    if (!hot) {
      return;
    }

    const handleUpdate = (update: PreviewEngineUpdate) => {
      setEntries(update.workspaceIndex.entries.map(mapEntry));
    };

    hot.on("lattice-preview:update", handleUpdate);
    return () => {
      hot.off?.("lattice-preview:update", handleUpdate);
    };
  }, []);

  return (
    <PreviewApp
      entries={entries}
      loadEntry={(id) => {
        const importer = previewImporters[id];
        if (!importer) {
          return Promise.reject(new Error(`No preview importer registered for \`${id}\`.`));
        }

        return importer().then((module) => {
          const payload = ("__previewEntryPayload" in module ? module.__previewEntryPayload : undefined) as
            | PreviewEntryPayload
            | undefined;

          if (payload) {
            setEntries((previousEntries) =>
              previousEntries.map((entry) => (entry.id === id ? mapEntry(payload.descriptor) : entry)),
            );
          }

          return {
            meta: payload ? mapRuntimeDiagnostics(payload) : { diagnostics: [] },
            module,
          };
        });
      }}
      projectName={previewWorkspaceIndex.projectName}
    />
  );
}
