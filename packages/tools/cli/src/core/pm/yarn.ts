import { type RunProcessOptions, runProcess } from "./run";
import type { PackageManager } from "./types";

export interface YarnPackageManagerOptions {
  /** Stream the package manager's own output instead of buffering it for failures. */
  stream?: boolean;
}

export function createYarnPackageManager(options?: YarnPackageManagerOptions): PackageManager {
  const run = (args: string[], cwd: string) =>
    runProcess("yarn", args, { cwd, stream: options?.stream ?? false } satisfies RunProcessOptions);

  return {
    name: "yarn",
    async add(dev, specs, cwd) {
      if (specs.length === 0) {
        return;
      }

      await run(["add", ...(dev ? ["--dev"] : []), ...specs], cwd);
    },
    async remove(specs, cwd) {
      if (specs.length === 0) {
        return;
      }

      await run(["remove", ...specs], cwd);
    },
    async install(cwd) {
      await run(["install"], cwd);
    },
    async exec(bin, args, cwd) {
      await run(["run", bin, ...args], cwd);
    },
  };
}
