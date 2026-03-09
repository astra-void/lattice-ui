declare module "@lattice-ui/compiler" {
  export type UnsupportedPatternCode = string;

  export type UnsupportedPatternError = {
    code: UnsupportedPatternCode;
    message: string;
    file: string;
    line: number;
    column: number;
    symbol?: string;
    target: string;
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

  export function transformPreviewSource(
    code: string,
    options: TransformPreviewSourceOptions,
  ): TransformPreviewSourceResult;

  export function compile_tsx(code: string): string;
}

declare module "@lattice-ui/layout-engine" {
  export type LayoutEngineModuleOrPath = string | URL | Request | Response | Blob | BufferSource | WebAssembly.Module;

  export type LayoutEngineInitInput =
    | {
        module_or_path?: LayoutEngineModuleOrPath | Promise<LayoutEngineModuleOrPath>;
      }
    | LayoutEngineModuleOrPath
    | Promise<LayoutEngineModuleOrPath>
    | undefined;

  export default function initLayoutEngine(input?: LayoutEngineInitInput): Promise<void>;

  export function compute_layout(raw_tree: unknown, viewport_width: number, viewport_height: number): unknown;
}
