#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { ROOT_DIR, readJson } from "./workspace-utils";

interface NapiScopedPackageManifest {
  main?: string;
}

const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const compilerDir = path.join(ROOT_DIR, "packages", "compiler");
const compilerManifestPath = path.join(compilerDir, "package.json");
const compilerManifestBackup = fs.readFileSync(compilerManifestPath, "utf8");

function runPnpm(args: string[]) {
  execFileSync(pnpmCommand, args, {
    cwd: ROOT_DIR,
    stdio: "inherit",
    env: process.env,
  });
}

function getRequiredCompilerArtifacts() {
  runPnpm(["--filter", "@lattice-ui/compiler", "run", "create-npm-dirs"]);

  const npmDir = path.join(compilerDir, "npm");
  const packageDirs = fs
    .readdirSync(npmDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  return packageDirs.map((dirName) => {
    const scopedManifest = readJson<NapiScopedPackageManifest>(path.join(npmDir, dirName, "package.json"));
    if (typeof scopedManifest.main !== "string" || scopedManifest.main.length === 0) {
      throw new Error(`Missing npm package entrypoint for compiler target "${dirName}".`);
    }

    return scopedManifest.main;
  });
}

function getMissingCompilerArtifacts() {
  const artifactsDir = path.join(compilerDir, "artifacts");

  return getRequiredCompilerArtifacts().filter((fileName) => !fs.existsSync(path.join(artifactsDir, fileName)));
}

const missingArtifacts = getMissingCompilerArtifacts();
if (missingArtifacts.length > 0) {
  console.error("Missing compiler artifacts for multi-platform publish.");
  console.error("Populate packages/compiler/artifacts with these files before rerunning:");
  for (const fileName of missingArtifacts) {
    console.error(`- ${fileName}`);
  }
  process.exit(1);
}

try {
  runPnpm(["run", "layout-engine:build:release"]);
  runPnpm(["--filter", "@lattice-ui/compiler", "run", "artifacts"]);
  runPnpm(["--filter", "@lattice-ui/compiler", "run", "prepublish:napi"]);
  runPnpm(["exec", "changeset", "publish"]);
} finally {
  const compilerManifestCurrent = fs.readFileSync(compilerManifestPath, "utf8");
  if (compilerManifestCurrent !== compilerManifestBackup) {
    fs.writeFileSync(compilerManifestPath, compilerManifestBackup, "utf8");
  }
}
