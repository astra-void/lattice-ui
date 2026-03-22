import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { usageError } from "../errors";
import type { PromptRuntime } from "../prompt";
import { promptSelect } from "../prompt";
import { createNpmPackageManager } from "./npm";
import { createPnpmPackageManager } from "./pnpm";
import type { PackageManager, PackageManagerName } from "./types";
import { createYarnPackageManager } from "./yarn";

export type PackageManagerResolutionSource = "override" | "lockfile" | "installed" | "prompt";

export interface DetectPackageManagerResult {
  name: PackageManagerName;
  manager: PackageManager;
  lockfiles: PackageManagerName[];
  installed: PackageManagerName[];
  source: PackageManagerResolutionSource;
}

export interface DetectPackageManagerOptions {
  runtime?: PromptRuntime;
  promptSelectFn?: typeof promptSelect;
  detectInstalledPackageManagersFn?: () => Promise<PackageManagerName[]>;
}

const promptPackageManagerOrder: PackageManagerName[] = ["npm", "pnpm", "yarn"];
const lockfileDetectionOrder: PackageManagerName[] = ["pnpm", "yarn", "npm"];
const PACKAGE_MANAGER_HINT = "--pm <pnpm|npm|yarn>";

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

function normalizePackageManagers(values: PackageManagerName[]): PackageManagerName[] {
  const unique = new Set(values);
  return promptPackageManagerOrder.filter((managerName) => unique.has(managerName));
}

async function isPackageManagerInstalled(managerName: PackageManagerName): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const child = spawn(managerName, ["--version"], {
      stdio: "ignore",
      shell: process.platform === "win32",
    });

    child.on("error", () => {
      resolve(false);
    });

    child.on("close", (code) => {
      resolve(code === 0);
    });
  });
}

export async function detectInstalledPackageManagers(): Promise<PackageManagerName[]> {
  const checks = await Promise.all(
    promptPackageManagerOrder.map(async (managerName) =>
      (await isPackageManagerInstalled(managerName)) ? managerName : null,
    ),
  );

  return checks.filter((managerName): managerName is PackageManagerName => managerName !== null);
}

function createResult(
  name: PackageManagerName,
  lockfiles: PackageManagerName[],
  installed: PackageManagerName[],
  source: PackageManagerResolutionSource,
): DetectPackageManagerResult {
  return {
    name,
    manager: managerFactory[name](),
    lockfiles,
    installed,
    source,
  };
}

function ensureInstalled(
  selected: PackageManagerName,
  installed: PackageManagerName[],
  reason: "override" | "lockfile",
): void {
  if (installed.includes(selected)) {
    return;
  }

  if (reason === "override") {
    throw usageError(
      `Requested package manager "${selected}" is not installed. Install ${selected} or choose a different ${PACKAGE_MANAGER_HINT}.`,
    );
  }

  throw usageError(
    `Detected ${selected} from ${lockfileByManager[selected]} but ${selected} is not installed. Install ${selected} or re-run with ${PACKAGE_MANAGER_HINT}.`,
  );
}

export async function detectPackageManager(
  cwd: string,
  override?: string,
  options?: DetectPackageManagerOptions,
): Promise<DetectPackageManagerResult> {
  const requested = override?.trim();
  if (requested && requested !== "pnpm" && requested !== "npm" && requested !== "yarn") {
    throw usageError(`Invalid --pm value "${override}". Use pnpm, npm, or yarn.`);
  }

  const lockfiles: PackageManagerName[] = [];
  for (const managerName of lockfileDetectionOrder) {
    if (await exists(path.join(cwd, lockfileByManager[managerName]))) {
      lockfiles.push(managerName);
    }
  }

  const installed = normalizePackageManagers(
    await (options?.detectInstalledPackageManagersFn ?? detectInstalledPackageManagers)(),
  );

  if (requested) {
    const selected = requested as PackageManagerName;
    ensureInstalled(selected, installed, "override");
    return createResult(selected, lockfiles, installed, "override");
  }

  if (lockfiles.length > 0) {
    const selected = lockfiles[0];
    ensureInstalled(selected, installed, "lockfile");
    return createResult(selected, lockfiles, installed, "lockfile");
  }

  if (installed.length === 0) {
    throw usageError("No supported package manager is installed. Install npm, pnpm, or yarn and re-run the command.");
  }

  if (installed.length === 1) {
    return createResult(installed[0], lockfiles, installed, "installed");
  }

  const runtime = options?.runtime ?? { yes: false, stdin: process.stdin, stdout: process.stdout };
  const stdin = runtime.stdin ?? process.stdin;
  const stdout = runtime.stdout ?? process.stdout;
  if (runtime.yes || !stdin.isTTY || !stdout.isTTY) {
    throw usageError(
      `Multiple package managers are installed (${installed.join(", ")}). Re-run with ${PACKAGE_MANAGER_HINT}.`,
    );
  }

  const selected = await (options?.promptSelectFn ?? promptSelect)(
    runtime,
    "Select a package manager",
    installed.map((managerName) => ({
      label: managerName,
      value: managerName,
    })),
    { defaultIndex: 0 },
  );

  return createResult(selected, lockfiles, installed, "prompt");
}
