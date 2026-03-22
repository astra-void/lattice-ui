import * as path from "node:path";
import { projectNotFoundError } from "./core/errors";
import { createLogger, type Logger } from "./core/logger";
import { detectPackageManager, type PackageManagerResolutionSource } from "./core/pm/detect";
import type { PackageManager, PackageManagerName } from "./core/pm/types";
import { findRoot } from "./core/project/findRoot";
import { loadRegistry } from "./core/registry/load";
import type { Registry } from "./core/registry/schema";

export interface ContextOptions {
  cwd: string;
  pm?: string;
  dryRun: boolean;
  yes: boolean;
  verbose?: boolean;
}

export interface CliContext {
  cwd: string;
  projectRoot: string;
  packageJsonPath: string;
  options: ContextOptions;
  logger: Logger;
  pm: PackageManager;
  pmName: PackageManagerName;
  detectedLockfiles: PackageManagerName[];
  installedPackageManagers: PackageManagerName[];
  pmResolutionSource: PackageManagerResolutionSource;
  registry: Registry;
}

export async function createContext(
  options: ContextOptions,
  config?: { allowMissingProject?: boolean },
): Promise<CliContext> {
  const cwd = path.resolve(options.cwd);
  const allowMissingProject = config?.allowMissingProject ?? false;

  const projectRoot = (await findRoot(cwd)) ?? (allowMissingProject ? cwd : undefined);
  if (!projectRoot) {
    throw projectNotFoundError(cwd);
  }

  const logger = createLogger({
    verbose: options.verbose ?? false,
    yes: options.yes,
  });

  const pm = await detectPackageManager(projectRoot, options.pm, {
    runtime: {
      yes: options.yes,
      stdin: process.stdin,
      stdout: process.stdout,
    },
  });
  const registry = await loadRegistry();

  return {
    cwd,
    projectRoot,
    packageJsonPath: path.join(projectRoot, "package.json"),
    options,
    logger,
    pm: pm.manager,
    pmName: pm.name,
    detectedLockfiles: pm.lockfiles,
    installedPackageManagers: pm.installed,
    pmResolutionSource: pm.source,
    registry,
  };
}
