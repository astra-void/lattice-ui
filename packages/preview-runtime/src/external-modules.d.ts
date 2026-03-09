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

declare module "*.wasm?url" {
  const url: string;
  export default url;
}
