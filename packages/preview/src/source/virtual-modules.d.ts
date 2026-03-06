declare module "virtual:lattice-preview-registry" {
  import type { PreviewRegistryItem } from "./types";

  export const previewEntries: PreviewRegistryItem[];
  export const previewImporters: Record<string, () => Promise<Record<string, unknown>>>;
  export const previewProjectName: string;
}
