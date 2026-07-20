import { type RunProcessOptions, runProcess } from "./run";
import type { PackageManager } from "./types";

export interface PnpmPackageManagerOptions {
  /** Stream the package manager's own output instead of buffering it for failures. */
  stream?: boolean;
}

export function createPnpmPackageManager(options?: PnpmPackageManagerOptions): PackageManager {
  const run = (args: string[], cwd: string) =>
    runProcess("pnpm", args, { cwd, stream: options?.stream ?? false } satisfies RunProcessOptions);

  return {
    name: "pnpm",
    async add(dev, specs, cwd) {
      if (specs.length === 0) {
        return;
      }

      await run(["add", ...(dev ? ["-D"] : []), ...specs], cwd);
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
      await run(["exec", bin, ...args], cwd);
    },
  };
}
