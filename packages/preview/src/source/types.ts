import type { ComponentType } from "react";

export type { PreviewComponentPropsMetadata, PreviewPropMetadata } from "@lattice-ui/preview-runtime";

export type PreviewDefinition<Props = Record<string, unknown>> = {
  entry?: ComponentType<Props>;
  title?: string;
  props?: Props;
  render?: () => unknown;
};

export type PreviewSourceTarget = {
  name: string;
  packageName?: string;
  packageRoot: string;
  sourceRoot: string;
};

export type PreviewAutoRenderSelectionReason = "default" | "basename-match" | "sole-export";

export type PreviewRenderFailureReason = "ambiguous-exports" | "no-component-export";

export type PreviewRenderTarget =
  | {
      mode: "auto";
      exportName: "default" | string;
      usesPreviewProps: boolean;
      selectedBy: PreviewAutoRenderSelectionReason;
    }
  | {
      mode: "preview-render";
    }
  | {
      mode: "preview-entry";
      exportName: string;
      usesPreviewProps: boolean;
    }
  | {
      mode: "auto";
      exportName: "default" | string;
      usesPreviewProps: boolean;
      selectedBy: PreviewAutoRenderSelectionReason;
    }
  | {
      mode: "none";
      reason: PreviewRenderFailureReason;
      candidates?: string[];
    };

export type PreviewEntryStatus =
  | "ready"
  | "needs-harness"
  | "ambiguous"
  | "blocked_by_transform"
  | "blocked_by_runtime"
  | "blocked_by_layout";

export type PreviewRegistryDiagnostic = {
  blocking?: boolean;
  code: string;
  column: number;
  file: string;
  line: number;
  message: string;
  phase?: "discovery" | "layout" | "runtime" | "transform";
  relativeFile: string;
  severity?: "error" | "info" | "warning";
  summary?: string;
  symbol?: string;
  target: string;
};

export type PreviewDiscoveryDiagnosticCode =
  | "AMBIGUOUS_COMPONENT_EXPORTS"
  | "LEGACY_AUTO_RENDER_FALLBACK"
  | "MISSING_EXPLICIT_PREVIEW_CONTRACT"
  | "NO_COMPONENT_EXPORTS"
  | "PREVIEW_RENDER_MISSING"
  | "TRANSITIVE_ANALYSIS_LIMITED";

export type PreviewDiscoveryDiagnostic = {
  code: PreviewDiscoveryDiagnosticCode;
  file: string;
  message: string;
  relativeFile: string;
};

export type PreviewRegistryItem = {
  id: string;
  packageName: string;
  relativePath: string;
  sourceFilePath: string;
  targetName: string;
  title: string;
  status: PreviewEntryStatus;
  render: PreviewRenderTarget;
  candidateExportNames: string[];
  autoRenderCandidate?: "default" | string;
  autoRenderReason?: PreviewAutoRenderSelectionReason;
  exportNames: string[];
  hasDefaultExport: boolean;
  hasPreviewExport: boolean;
  discoveryDiagnostics: PreviewDiscoveryDiagnostic[];
};

export type PreviewEntryMeta = {
  diagnostics: PreviewRegistryDiagnostic[];
};

export type PreviewProject = {
  packageName: string;
  packageRoot: string;
  sourceRoot: string;
  entries: PreviewRegistryItem[];
};

export type PreviewWorkspace = {
  projectName: string;
  entries: PreviewRegistryItem[];
  targets: PreviewSourceTarget[];
};
