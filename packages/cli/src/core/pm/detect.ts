import { promises as fs } from "node:fs";
import * as path from "node:path";
import { usageError } from "../errors";
import { createNpmPackageManager } from "./npm";
import { createPnpmPackageManager } from "./pnpm";
import type { PackageManager, PackageManagerName } from "./types";
import { createYarnPackageManager } from "./yarn";

export interface DetectPackageManagerResult {
  name: PackageManagerName;
  manager: PackageManager;
  lockfiles: PackageManagerName[];
}

const lockfileByManager: Record<PackageManagerName, string> = {
  pnpm: "pnpm-lock.yaml",
  yarn: "yarn.lock",
  npm: "package-lock.json",
};

const managerFactory: Record<PackageManagerName, () => PackageManager> = {
  pnpm: createPnpmPackageManager,
  yarn: createYarnPackageManager,
  npm: createNpmPackageManager,
};

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function detectPackageManager(cwd: string, override?: string): Promise<DetectPackageManagerResult> {
  const requested = override?.trim();
  if (requested && requested !== "pnpm" && requested !== "npm" && requested !== "yarn") {
    throw usageError(`Invalid --pm value "${override}". Use pnpm, npm, or yarn.`);
  }

  const lockfiles: PackageManagerName[] = [];
  for (const managerName of ["pnpm", "yarn", "npm"] as const) {
    if (await exists(path.join(cwd, lockfileByManager[managerName]))) {
      lockfiles.push(managerName);
    }
  }

  const selected: PackageManagerName = requested ? (requested as PackageManagerName) : (lockfiles[0] ?? "npm");

  return {
    name: selected,
    manager: managerFactory[selected](),
    lockfiles,
  };
}
