import { resolveRealFilePath } from "./pathUtils";
import type {
  PreviewAutoRenderSelectionReason,
  PreviewDiagnostic,
  PreviewGraphTrace,
  PreviewRenderTarget,
  PreviewSelection,
} from "./types";

export type LegacyCompatInput = {
  candidateExportNames: string[];
  entryId: string;
  filePath: string;
  graphTrace: PreviewGraphTrace;
  hasDefaultExport: boolean;
  packageRoot: string;
  previewHasProps: boolean;
};

export type LegacyCompatResult = {
  autoRenderCandidate?: "default" | string;
  autoRenderReason?: PreviewAutoRenderSelectionReason;
  diagnostics: PreviewDiagnostic[];
  renderTarget: PreviewRenderTarget;
  selection: PreviewSelection;
};

export function compatSelectionDiagnostic(options: {
  entryId: string;
  filePath: string;
  packageRoot: string;
  reason: PreviewAutoRenderSelectionReason;
}) {
  return {
    code: "LEGACY_AUTO_RENDER_FALLBACK",
    entryId: options.entryId,
    file: options.filePath,
    phase: "discovery",
    relativeFile: relativeToPackage(options.packageRoot, options.filePath),
    severity: "warning",
    summary:
      `This entry still relies on legacy export inference (${options.reason}). ` +
      "Add `preview.entry` or `preview.render` to make preview selection explicit.",
    target: "preview-engine",
  } satisfies PreviewDiagnostic;
}

export function applyLegacyInferenceAdapter(options: LegacyCompatInput): LegacyCompatResult | undefined {
  if (options.hasDefaultExport) {
    return createCompatResult(options, "default", "default");
  }

  const fileBasename = basename(options.filePath);
  const basenameCandidate = options.candidateExportNames.find((candidate) => candidate === fileBasename);
  if (basenameCandidate) {
    return createCompatResult(options, basenameCandidate, "basename-match");
  }

  if (options.candidateExportNames.length === 1) {
    return createCompatResult(options, options.candidateExportNames[0]!, "sole-export");
  }

  return undefined;
}

function basename(filePath: string) {
  const normalized = resolveRealFilePath(filePath).replace(/\\/g, "/");
  const lastSegment = normalized.split("/").pop() ?? normalized;
  const extensionIndex = lastSegment.lastIndexOf(".");
  return extensionIndex === -1 ? lastSegment : lastSegment.slice(0, extensionIndex);
}

function createCompatResult(
  options: LegacyCompatInput,
  exportName: "default" | string,
  reason: PreviewAutoRenderSelectionReason,
): LegacyCompatResult {
  return {
    autoRenderCandidate: exportName,
    autoRenderReason: reason,
    diagnostics: [
      compatSelectionDiagnostic({
        entryId: options.entryId,
        filePath: options.filePath,
        packageRoot: options.packageRoot,
        reason,
      }),
    ],
    renderTarget: {
      exportName,
      kind: "component",
      usesPreviewProps: options.previewHasProps,
    },
    selection: {
      kind: "compat",
      reason,
    },
  };
}

function relativeToPackage(packageRoot: string, filePath: string) {
  const normalizedPackageRoot = resolveRealFilePath(packageRoot).replace(/\\/g, "/");
  const normalizedFilePath = resolveRealFilePath(filePath).replace(/\\/g, "/");
  if (normalizedFilePath.startsWith(`${normalizedPackageRoot}/`)) {
    return normalizedFilePath.slice(normalizedPackageRoot.length + 1);
  }

  return normalizedFilePath;
}
