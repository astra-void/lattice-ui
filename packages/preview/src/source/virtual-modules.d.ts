declare module "virtual:lattice-preview-registry" {
  import type { PreviewEntryMeta, PreviewRegistryItem } from "./types";

  export const previewEntries: PreviewRegistryItem[];
  export const previewImporters: Record<string, () => Promise<Record<string, unknown> & { __previewEntryMeta: PreviewEntryMeta }>>;
  export const previewProjectName: string;
}

declare module "virtual:lattice-preview-entry:*" {
  import type { PreviewEntryMeta } from "./types";

  export const __previewEntryMeta: PreviewEntryMeta;
  const previewEntryModule: Record<string, unknown>;
  export default previewEntryModule;
}
