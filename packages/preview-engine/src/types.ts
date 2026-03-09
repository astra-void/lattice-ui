import type { ComponentType } from "react";
import type {
  PreviewTransformDiagnostic,
  PreviewTransformMode,
  PreviewTransformOutcome,
} from "@lattice-ui/compiler";

export const PREVIEW_ENGINE_PROTOCOL_VERSION = 2;

export type PreviewPropKind =
  | "array"
  | "bigint"
  | "boolean"
  | "function"
  | "literal"
  | "number"
  | "object"
  | "react-element"
  | "react-node"
  | "string"
  | "union"
  | "unknown";

export type PreviewPropMetadata = {
  elementType?: PreviewPropMetadata;
  kind: PreviewPropKind;
  literal?: boolean | number | string | null;
  properties?: Record<string, PreviewPropMetadata>;
  required: boolean;
  type: string;
  unionTypes?: PreviewPropMetadata[];
};

export type PreviewComponentPropsMetadata = {
  componentName: string;
  props: Record<string, PreviewPropMetadata>;
};

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

export type PreviewSelectionMode = "compat" | "strict";
export type PreviewExecutionMode = PreviewTransformMode;

export type PreviewAutoRenderSelectionReason = "default" | "basename-match" | "sole-export";

export type PreviewEntryStatus =
  | "ready"
  | "needs_harness"
  | "ambiguous"
  | "blocked_by_transform"
  | "blocked_by_runtime"
  | "blocked_by_layout";

export type PreviewDiagnosticPhase = "discovery" | "layout" | "runtime" | "transform";
export type PreviewDiagnosticSeverity = "error" | "info" | "warning";

export type PreviewDiscoveryDiagnosticCode =
  | "AMBIGUOUS_COMPONENT_EXPORTS"
  | "LEGACY_AUTO_RENDER_FALLBACK"
  | "MISSING_EXPLICIT_PREVIEW_CONTRACT"
  | "NO_COMPONENT_EXPORTS"
  | "PREVIEW_RENDER_MISSING"
  | "TRANSITIVE_ANALYSIS_LIMITED";

export type PreviewRenderTarget =
  | {
      kind: "component";
      exportName: "default" | string;
      usesPreviewProps: boolean;
    }
  | {
      contract: "preview.render";
      kind: "harness";
    }
  | {
      kind: "none";
      reason: "ambiguous-exports" | "missing-explicit-contract" | "no-component-export";
      candidates?: string[];
    };

export type PreviewSelection =
  | {
      contract: "preview.entry" | "preview.render";
      kind: "explicit";
    }
  | {
      kind: "compat";
      reason: PreviewAutoRenderSelectionReason;
    }
  | {
      kind: "unresolved";
      reason: "ambiguous-exports" | "missing-explicit-contract" | "no-component-export";
    };

export type PreviewEntryCapabilities = {
  supportsHotUpdate: boolean;
  supportsLayoutDebug: boolean;
  supportsPropsEditing: boolean;
  supportsRuntimeMock: boolean;
};

export type PreviewDiagnosticsSummary = {
  byPhase: Record<PreviewDiagnosticPhase, number>;
  hasBlocking: boolean;
  total: number;
};

export type PreviewDiagnostic = {
  blocking?: boolean;
  code: PreviewDiscoveryDiagnosticCode | PreviewTransformDiagnostic["code"] | string;
  details?: string;
  entryId: string;
  file: string;
  importChain?: string[];
  phase: PreviewDiagnosticPhase;
  relativeFile: string;
  severity: PreviewDiagnosticSeverity;
  summary: string;
  symbol?: string;
  target: string;
};

export type PreviewGraphImportEdge = {
  crossesPackageBoundary: boolean;
  importerFile: string;
  resolution: "resolved" | "stopped";
  resolvedFile?: string;
  specifier: string;
  stopReason?: string;
};

export type PreviewSelectionTrace = {
  contract?: "preview.entry" | "preview.render";
  importChain: string[];
  requestedSymbol?: string;
  resolvedExportName?: string;
  symbolChain: string[];
};

export type PreviewGraphTrace = {
  boundaryHops: Array<{
    fromFile: string;
    fromPackageRoot: string;
    toFile: string;
    toPackageRoot: string;
  }>;
  imports: PreviewGraphImportEdge[];
  selection: PreviewSelectionTrace;
  stopReason?: string;
};

export type PreviewEntryDescriptor = {
  capabilities: PreviewEntryCapabilities;
  candidateExportNames: string[];
  diagnosticsSummary: PreviewDiagnosticsSummary;
  hasDefaultExport: boolean;
  hasPreviewExport: boolean;
  id: string;
  packageName: string;
  relativePath: string;
  renderTarget: PreviewRenderTarget;
  selection: PreviewSelection;
  sourceFilePath: string;
  status: PreviewEntryStatus;
  targetName: string;
  title: string;
};

export type PreviewRuntimeAdapter = {
  kind: "react-dom";
  moduleId: string;
};

export type PreviewTransformState = {
  mode: PreviewExecutionMode;
  outcome: PreviewTransformOutcome;
};

export type PreviewEntryPayload = {
  descriptor: PreviewEntryDescriptor;
  diagnostics: PreviewDiagnostic[];
  graphTrace: PreviewGraphTrace;
  propsMetadata?: PreviewComponentPropsMetadata;
  protocolVersion: number;
  runtimeAdapter: PreviewRuntimeAdapter;
  transform: PreviewTransformState;
};

export type PreviewWorkspaceIndex = {
  entries: PreviewEntryDescriptor[];
  projectName: string;
  protocolVersion: number;
  targets: PreviewSourceTarget[];
};

export type PreviewBuildArtifactKind = "module" | "entry-metadata" | "layout-schema";

export type PreviewBuildDiagnostic = PreviewDiagnostic | PreviewTransformDiagnostic;

export type PreviewBuiltArtifact = {
  cacheKey: string;
  diagnosticsSummary: PreviewDiagnosticsSummary;
  id: string;
  kind: PreviewBuildArtifactKind;
  materializedPath?: string;
  relativePath: string;
  reusedFromCache: boolean;
  sourceFilePath: string;
  targetName: string;
};

export type PreviewBuildOptions = {
  artifactKinds: PreviewBuildArtifactKind[];
  cacheDir?: string;
  concurrency?: number;
  outDir?: string;
  projectName: string;
  runtimeModule?: string;
  selectionMode?: PreviewSelectionMode;
  targets: PreviewSourceTarget[];
  transformMode?: PreviewExecutionMode;
  workspaceRoot?: string;
};

export type PreviewBuildResult = {
  builtArtifacts: PreviewBuiltArtifact[];
  cacheDir: string;
  diagnostics: PreviewBuildDiagnostic[];
  outDir?: string;
  removedFiles: string[];
  reusedArtifacts: PreviewBuiltArtifact[];
  writtenFiles: string[];
};

export type PreviewBuildOutputManifest = {
  artifactKinds: PreviewBuildArtifactKind[];
  files: Record<
    string,
    {
      cacheKey: string;
      sourceFilePath: string;
    }
  >;
  version: 2;
  workspaceRoot: string;
};

export type PreviewCachedArtifactMetadata = {
  artifactKind: PreviewBuildArtifactKind;
  cacheKey: string;
  createdAt: string;
  diagnostics: PreviewBuildDiagnostic[];
  engineVersion: number;
  sourceFilePath: string;
  targetName: string;
};

export type PreviewEngineUpdate = {
  changedEntryIds: string[];
  protocolVersion: number;
  removedEntryIds: string[];
  requiresFullReload: boolean;
  workspaceChanged: boolean;
  workspaceIndex: PreviewWorkspaceIndex;
};

export type CreatePreviewEngineOptions = {
  projectName: string;
  runtimeModule?: string;
  selectionMode?: PreviewSelectionMode;
  targets: PreviewSourceTarget[];
  transformMode?: PreviewExecutionMode;
};

export type PreviewEngineUpdateListener = (update: PreviewEngineUpdate) => void;

export interface PreviewEngine {
  dispose(): void;
  getEntryPayload(entryId: string): PreviewEntryPayload;
  getTargetForFilePath(filePath: string): PreviewSourceTarget | undefined;
  getWorkspaceIndex(): PreviewWorkspaceIndex;
  invalidateFiles(filePaths: string[]): PreviewEngineUpdate;
  onUpdate(listener: PreviewEngineUpdateListener): () => void;
}
