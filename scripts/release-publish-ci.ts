#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { ROOT_DIR } from "./workspace-utils";

function main() {
  const dryRun = process.env.RELEASE_DRY_RUN === "true";
  const distTag = process.env.NPM_DIST_TAG?.trim();

  const args = ["-r", "--filter", "./packages/*", "publish", "--access", "public", "--report-summary", "--provenance"];

  if (dryRun) {
    args.push("--dry-run");
  }

  if (distTag) {
    args.push("--tag", distTag);
  }

  console.log(`[release-publish-ci] mode=${dryRun ? "dry-run" : "publish"} dist-tag=${distTag || "latest(default)"}`);
  console.log(`[release-publish-ci] pnpm ${args.join(" ")}`);

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

  process.exit(result.status ?? 1);
}

main();
