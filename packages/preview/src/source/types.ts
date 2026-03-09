import type { UnsupportedPatternError } from "@lattice-ui/compiler";

export type { PreviewComponentPropsMetadata, PreviewPropMetadata } from "@lattice-ui/preview-runtime";

export type PreviewDefinition<Props = Record<string, unknown>> = {
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

export type PreviewRenderTarget =
  | {
      mode: "auto";
      exportName: "default" | string;
      usesPreviewProps: boolean;
    }
  | {
      mode: "preview-render";
    }
  | {
      mode: "none";
    };

export type PreviewEntryStatus = "ready" | "needs-harness" | "ambiguous" | "error";

export type PreviewRegistryDiagnostic = UnsupportedPatternError & {
  relativeFile: string;
};

export type PreviewDiscoveryDiagnosticCode =
  | "AMBIGUOUS_COMPONENT_EXPORTS"
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
  exportNames: string[];
  hasDefaultExport: boolean;
  hasPreviewExport: boolean;
  diagnostics: PreviewRegistryDiagnostic[];
  discoveryDiagnostics: PreviewDiscoveryDiagnostic[];
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
