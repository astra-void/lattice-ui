import * as path from "node:path";
import { projectNotFoundError } from "./core/errors";
import { createLogger, type Logger } from "./core/logger";
import { detectPackageManager } from "./core/pm/detect";
import type { PackageManager, PackageManagerName } from "./core/pm/types";
import { findRoot } from "./core/project/findRoot";
import { loadRegistry } from "./core/registry/load";
import type { Registry } from "./core/registry/schema";

export interface GlobalOptions {
  cwd: string;
  pm?: string;
  verbose: boolean;
  dryRun: boolean;
  yes: boolean;
}

export interface CliContext {
  cwd: string;
  projectRoot: string;
  packageJsonPath: string;
  options: GlobalOptions;
  logger: Logger;
  pm: PackageManager;
  pmName: PackageManagerName;
  detectedLockfiles: PackageManagerName[];
  registry: Registry;
}

export async function createContext(
  options: GlobalOptions,
  config?: { allowMissingProject?: boolean },
): Promise<CliContext> {
  const cwd = path.resolve(options.cwd);
  const allowMissingProject = config?.allowMissingProject ?? false;

  const projectRoot = (await findRoot(cwd)) ?? (allowMissingProject ? cwd : undefined);
  if (!projectRoot) {
    throw projectNotFoundError(cwd);
  }

  const logger = createLogger({
    verbose: options.verbose,
    yes: options.yes,
  });

  const pm = await detectPackageManager(projectRoot, options.pm);
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
    registry,
  };
}
