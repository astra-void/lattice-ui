import type { PackageManagerName } from "./pm/types";

export interface SummarizedItems {
  total: number;
  visible: string[];
  hidden: number;
}

export function resolveLocalLatticeCommand(pmName: PackageManagerName): string {
  if (pmName === "npm") {
    return "npx lattice";
  }

  return `${pmName} lattice`;
}

export function summarizeItems(items: string[], limit = 8): SummarizedItems {
  const normalizedLimit = Math.max(0, Math.floor(limit));
  const uniqueItems = [...new Set(items)];
  const visible = uniqueItems.slice(0, normalizedLimit);
  return {
    total: uniqueItems.length,
    visible,
    hidden: Math.max(0, uniqueItems.length - visible.length),
  };
}
