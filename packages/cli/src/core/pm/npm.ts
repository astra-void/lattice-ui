import { spawn } from "node:child_process";
import { packageManagerFailedError } from "../errors";
import type { PackageManager } from "./types";

function run(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("error", (error) => {
      reject(packageManagerFailedError(`Failed to run ${command}: ${error.message}`, error));
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(packageManagerFailedError(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}.`));
    });
  });
}

export function createNpmPackageManager(): PackageManager {
  return {
    name: "npm",
    async add(dev, specs, cwd) {
      if (specs.length === 0) {
        return;
      }

      const args = ["install", ...(dev ? ["--save-dev"] : []), ...specs];
      await run("npm", args, cwd);
    },
    async remove(specs, cwd) {
      if (specs.length === 0) {
        return;
      }

      await run("npm", ["uninstall", ...specs], cwd);
    },
    async install(cwd) {
      await run("npm", ["install"], cwd);
    },
    async exec(bin, args, cwd) {
      await run("npm", ["exec", "--", bin, ...args], cwd);
    },
  };
}
