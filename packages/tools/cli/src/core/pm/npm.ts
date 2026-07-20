import { type RunProcessOptions, runProcess } from "./run";
import type { PackageManager } from "./types";

export interface NpmPackageManagerOptions {
  /** Stream the package manager's own output instead of buffering it for failures. */
  stream?: boolean;
}

export function createNpmPackageManager(options?: NpmPackageManagerOptions): PackageManager {
  const run = (args: string[], cwd: string) =>
    runProcess("npm", args, { cwd, stream: options?.stream ?? false } satisfies RunProcessOptions);

  return {
    name: "npm",
    async add(dev, specs, cwd) {
      if (specs.length === 0) {
        return;
      }

      await run(["install", ...(dev ? ["--save-dev"] : []), ...specs], cwd);
    },
    async remove(specs, cwd) {
      if (specs.length === 0) {
        return;
      }

      await run(["uninstall", ...specs], cwd);
    },
    async install(cwd) {
      await run(["install"], cwd);
    },
    async exec(bin, args, cwd) {
      await run(["exec", "--", bin, ...args], cwd);
    },
  };
}
