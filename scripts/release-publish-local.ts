#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { ROOT_DIR } from "./workspace-utils";

const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function runPnpm(args: string[]) {
  execFileSync(pnpmCommand, args, {
    cwd: ROOT_DIR,
    stdio: "inherit",
    env: process.env,
  });
}

runPnpm(["exec", "changeset", "publish"]);
