#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { ROOT_DIR } from "./workspace-utils";

function runPnpm(args: string[]) {
  const result = spawnSync("pnpm", args, {
    cwd: ROOT_DIR,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
    windowsHide: true,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

runPnpm(["exec", "changeset", "publish"]);
