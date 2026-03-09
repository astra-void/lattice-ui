declare module "@lattice-ui/compiler" {
  export type PreviewTransformMode = "strict-fidelity" | "compatibility" | "mocked" | "design-time";
  export type PreviewTransformSeverity = "error" | "info" | "warning";

  export type PreviewTransformDiagnostic = {
    blocking: boolean;
    code: string;
    details?: string;
    file: string;
    line: number;
    column: number;
    severity: PreviewTransformSeverity;
    summary: string;
    symbol?: string;
    target: string;
  };

  export type UnsupportedPatternError = PreviewTransformDiagnostic;

  export type TransformPreviewSourceOptions = {
    filePath: string;
    mode?: PreviewTransformMode;
    runtimeModule: string;
    target: string;
  };

  export type PreviewTransformOutcome = {
    fidelity: "preserved" | "degraded" | "metadata-only";
    kind: "ready" | "compatibility" | "mocked" | "blocked" | "design-time";
  };

  export type TransformPreviewSourceResult = {
    code: string | null;
    diagnostics: PreviewTransformDiagnostic[];
    outcome: PreviewTransformOutcome;
    errors?: UnsupportedPatternError[];
  };

  export function transformPreviewSource(
    code: string,
    options: TransformPreviewSourceOptions,
  ): TransformPreviewSourceResult;
}
