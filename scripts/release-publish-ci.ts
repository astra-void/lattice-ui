#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { ROOT_DIR } from "./workspace-utils";

function main() {
  const dryRun = process.env.RELEASE_DRY_RUN === "true";
  const distTag = process.env.NPM_DIST_TAG?.trim();

  // Tag-triggered CI checks out a detached HEAD, so pnpm's branch check
  // cannot pass; the workflow has already validated the release state.
  const args = [
    "-r",
    "--filter",
    "./packages/*",
    "publish",
    "--access",
    "public",
    "--report-summary",
    "--provenance",
    "--no-git-checks",
  ];

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
