type PreviewDefinition = import("./types").PreviewDefinition;
type PreviewRegistryItem = import("./types").PreviewRegistryItem;
type PreviewModule = Record<string, unknown> & {
  default?: unknown;
  preview?: PreviewDefinition;
};

declare module "virtual:lattice-preview-registry" {
  export const previewProjectName: string;
  export const previewEntries: PreviewRegistryItem[];
  export const previewImporters: Record<string, () => Promise<PreviewModule>>;
}
