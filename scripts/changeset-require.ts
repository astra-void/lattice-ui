#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { ROOT_DIR } from "./workspace-utils.ts";

const changesetDir = path.join(ROOT_DIR, ".changeset");
if (!fs.existsSync(changesetDir)) {
  console.error("Missing .changeset directory.");
  process.exit(1);
}

const files = fs
  .readdirSync(changesetDir, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .filter((fileName) => fileName.endsWith(".md"))
  .filter((fileName) => fileName !== "README.md");

if (files.length === 0) {
  console.error('No pending changeset found. Run "pnpm changeset:add" before release:prepare.');
  process.exit(1);
}

console.log(`Pending changesets: ${files.length}`);
