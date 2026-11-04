import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { usageError } from "../errors";
import { findWorkspaceRoot } from "../project/findRoot";
import { readPackageJson } from "../project/readPackageJson";
import type { PromptRuntime } from "../prompt";
import { promptSelect } from "../prompt";
import { toSpawnInvocation } from "../spawnCommand";
import { type PackageManagerPin, readPackageManagerPins } from "./devEngines";
import { createNpmPackageManager } from "./npm";
import { createPnpmPackageManager } from "./pnpm";
import type { PackageManager, PackageManagerName } from "./types";
import { createYarnPackageManager } from "./yarn";

export type PackageManagerResolutionSource = "override" | "lockfile" | "manifest" | "installed" | "prompt";

export interface DetectPackageManagerResult {
  name: PackageManagerName;
  manager: PackageManager;
  lockfiles: PackageManagerName[];
  installed: PackageManagerName[];
  source: PackageManagerResolutionSource;
  pins: PackageManagerPin[];
}

export interface DetectPackageManagerOptions {
  runtime?: PromptRuntime;
  /** Stream the package manager's own output rather than buffering it. Follows `--verbose`. */
  stream?: boolean;
  promptSelectFn?: typeof promptSelect;
  detectInstalledPackageManagersFn?: () => Promise<PackageManagerName[]>;
  /**
   * With several managers installed and nothing else to go on, take the default (the first in
   * prompt order) instead of prompting. For read-only commands such as `doctor`.
   */
  preferDefault?: boolean;
}

const promptPackageManagerOrder: PackageManagerName[] = ["npm", "pnpm", "yarn"];
const lockfileDetectionOrder: PackageManagerName[] = ["pnpm", "yarn", "npm"];
const PACKAGE_MANAGER_HINT = "--pm <pnpm|npm|yarn>";

const lockfileByManager: Record<PackageManagerName, string> = {
  pnpm: "pnpm-lock.yaml",
  yarn: "yarn.lock",
  npm: "package-lock.json",
};

const managerFactory: Record<PackageManagerName, (options?: { stream?: boolean }) => PackageManager> = {
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

async function findLockfiles(dir: string): Promise<PackageManagerName[]> {
  const lockfiles: PackageManagerName[] = [];
  for (const managerName of lockfileDetectionOrder) {
    if (await exists(path.join(dir, lockfileByManager[managerName]))) {
      lockfiles.push(managerName);
    }
  }

  return lockfiles;
}

function normalizePackageManagers(values: PackageManagerName[]): PackageManagerName[] {
  const unique = new Set(values);
  return promptPackageManagerOrder.filter((managerName) => unique.has(managerName));
}

async function isPackageManagerInstalled(managerName: PackageManagerName): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    // Probe from a neutral directory, never the user's project: pnpm 10+ reads the
    // project's `devEngines.packageManager` pin, so probing there can install a
    // pinned pnpm (writing a lockfile) or refuse to run when another manager is pinned.
    const invocation = toSpawnInvocation(managerName, ["--version"]);
    const child = spawn(invocation.command, invocation.args, {
      cwd: os.tmpdir(),
      stdio: "ignore",
      shell: invocation.shell,
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
  pins: PackageManagerPin[],
  stream = false,
): DetectPackageManagerResult {
  return {
    name,
    manager: managerFactory[name]({ stream }),
    lockfiles,
    installed,
    source,
    pins,
  };
}

function ensureInstalled(
  selected: PackageManagerName,
  installed: PackageManagerName[],
  reason: "override" | "lockfile" | "manifest",
): void {
  if (installed.includes(selected)) {
    return;
  }

  if (reason === "override") {
    throw usageError(
      `Requested package manager "${selected}" is not installed. Install ${selected} or choose a different ${PACKAGE_MANAGER_HINT}.`,
    );
  }

  if (reason === "manifest") {
    throw usageError(
      `package.json pins this project to ${selected} but ${selected} is not installed. Install ${selected} or re-run with ${PACKAGE_MANAGER_HINT} to repin the project.`,
    );
  }

  throw usageError(
    `Detected ${selected} from ${lockfileByManager[selected]} but ${selected} is not installed. Install ${selected} or re-run with ${PACKAGE_MANAGER_HINT}.`,
  );
}

async function readPackageManagerPinsAt(cwd: string): Promise<PackageManagerPin[]> {
  try {
    return readPackageManagerPins(await readPackageJson(cwd));
  } catch {
    return [];
  }
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

  // A workspace member has no lockfile of its own; the shared one sits at the workspace root.
  let lockfiles = await findLockfiles(cwd);
  if (lockfiles.length === 0) {
    const workspaceRoot = await findWorkspaceRoot(cwd);
    if (workspaceRoot !== undefined) {
      lockfiles = await findLockfiles(workspaceRoot);
    }
  }

  const installed = normalizePackageManagers(
    await (options?.detectInstalledPackageManagersFn ?? detectInstalledPackageManagers)(),
  );
  const pins = await readPackageManagerPinsAt(cwd);

  if (requested) {
    const selected = requested as PackageManagerName;
    ensureInstalled(selected, installed, "override");
    return createResult(selected, lockfiles, installed, "override", pins, options?.stream);
  }

  if (lockfiles.length > 0) {
    const selected = lockfiles[0];
    ensureInstalled(selected, installed, "lockfile");
    return createResult(selected, lockfiles, installed, "lockfile", pins, options?.stream);
  }

  if (pins.length > 0) {
    const selected = pins[0].name;
    ensureInstalled(selected, installed, "manifest");
    return createResult(selected, lockfiles, installed, "manifest", pins, options?.stream);
  }

  if (installed.length === 0) {
    throw usageError("No supported package manager is installed. Install npm, pnpm, or yarn and re-run the command.");
  }

  if (installed.length === 1) {
    return createResult(installed[0], lockfiles, installed, "installed", pins, options?.stream);
  }

  const runtime = options?.runtime ?? { yes: false, stdin: process.stdin, stdout: process.stdout };
  // `--yes` accepts the default answer to every prompt, including this one: the
  // prompt's default is the first installed manager in prompt order.
  if (runtime.yes || options?.preferDefault === true) {
    return createResult(installed[0], lockfiles, installed, "installed", pins, options?.stream);
  }

  const stdin = runtime.stdin ?? process.stdin;
  const stdout = runtime.stdout ?? process.stdout;
  if (!stdin.isTTY || !stdout.isTTY) {
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

  return createResult(selected, lockfiles, installed, "prompt", pins, options?.stream);
}
