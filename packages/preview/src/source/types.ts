import type { UnsupportedPatternError } from "../compiler/types";

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

export type PreviewEntryStatus = "ready" | "needs-harness" | "error";

export type PreviewRegistryDiagnostic = UnsupportedPatternError & {
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
