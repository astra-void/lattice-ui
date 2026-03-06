export type PreviewBuildTarget = {
  name: string;
  sourceRoot: string;
};

export type UnsupportedPatternCode =
  | "UNSUPPORTED_GLOBAL"
  | "UNSUPPORTED_ENUM"
  | "UNSUPPORTED_HOST_ELEMENT"
  | "UNSUPPORTED_RUNTIME_PATTERN";

export type UnsupportedPatternError = {
  code: UnsupportedPatternCode;
  message: string;
  file: string;
  line: number;
  column: number;
  symbol?: string;
  target: string;
};

export type BuildPreviewModulesOptions = {
  targets: PreviewBuildTarget[];
  outDir?: string;
  runtimeModule?: string;
  failOnUnsupported?: boolean;
};

export type BuildPreviewModulesResult = {
  outDir: string;
  writtenFiles: string[];
};

export type TransformPreviewSourceOptions = {
  filePath: string;
  runtimeModule: string;
  target: string;
};

export type TransformPreviewSourceResult = {
  code: string;
  errors: UnsupportedPatternError[];
};

export class PreviewBuildError extends Error {
  readonly errors: UnsupportedPatternError[];

  constructor(errors: UnsupportedPatternError[]) {
    super(`Preview generation failed with ${errors.length} unsupported pattern(s).`);
    this.errors = errors;
    this.name = "PreviewBuildError";
  }
}
