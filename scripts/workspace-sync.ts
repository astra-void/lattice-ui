#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import * as path from "node:path";
import {
  coerceInternalDependencySpec,
  createTypecheckTsconfig,
  dependencyFields,
  ensureDir,
  fileExists,
  getInternalPackageNames,
  getLockedVersion,
  getPolicy,
  isToolingPackage,
  jsonEqual,
  listApps,
  listPackages,
  listPathMapFiles,
  normalizePackageManifest,
  type PackageManifest,
  ROOT_DIR,
  readJson,
  sortRecord,
  writeJson,
} from "./workspace-utils";

interface PathMapTsconfig {
  compilerOptions?: {
    baseUrl?: string;
    paths?: Record<string, string[]>;
  };
}

/** Inserts each missing entry at its sorted position, leaving the existing (hand-ordered) entries alone. */
function insertPathEntries(
  paths: Record<string, string[]>,
  additions: Array<[string, string[]]>,
): Record<string, string[]> {
  const entries = Object.entries(paths);
  for (const [name, target] of additions) {
    const index = entries.findIndex(([existingName]) => existingName.localeCompare(name) > 0);
    entries.splice(index === -1 ? entries.length : index, 0, [name, target]);
  }
  return Object.fromEntries(entries);
}

interface ChangesetConfigOptions {
  access: string;
  baseBranch: string;
  ignore: string[];
  fixed: string[][];
}

interface ChangesetConfig {
  $schema?: string;
  changelog?: boolean;
  commit?: boolean;
  access: string;
  baseBranch: string;
  updateInternalDependencies?: string;
  ignore: string[];
  fixed: string[][];
  linked: unknown[];
  ___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH?: unknown;
}

function buildChangesetConfig(
  existingConfig: Partial<ChangesetConfig>,
  options: ChangesetConfigOptions,
): ChangesetConfig {
  const next: ChangesetConfig = {
    $schema: existingConfig.$schema ?? "https://unpkg.com/@changesets/config@3.1.1/schema.json",
    changelog: existingConfig.changelog ?? false,
    commit: existingConfig.commit ?? false,
    access: options.access,
    baseBranch: options.baseBranch,
    updateInternalDependencies: existingConfig.updateInternalDependencies ?? "patch",
    ignore: options.ignore,
    fixed: options.fixed,
    linked: Array.isArray(existingConfig.linked) ? existingConfig.linked : [],
  };

  if (existingConfig.___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH) {
    next.___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH =
      existingConfig.___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH;
  }

  return next;
}

const policy = getPolicy();
const packages = listPackages();
const apps = listApps();

if (packages.length === 0) {
  console.error("No packages were found in packages/*.");
  process.exit(1);
}

const internalNames = getInternalPackageNames(packages);
const lockedVersion = getLockedVersion(policy, packages);
const defaults = policy.packageDefaults ?? {};
const defaultScripts = defaults.scripts ?? {};
const defaultPeerDependencies = policy.defaultPeerDependencies ?? {};
const internalDependencySpec = policy.internalDependencyVersion ?? "workspace:*";

let manifestUpdates = 0;
for (const pkg of packages) {
  const toolingPackage = isToolingPackage(policy, pkg.manifest.name);
  const nextManifest: PackageManifest = structuredClone(pkg.manifest);

  nextManifest.version = lockedVersion;

  if (typeof defaults.private === "boolean") {
    nextManifest.private = defaults.private;
  }

  if (!toolingPackage) {
    if (defaults.main) {
      nextManifest.main = defaults.main;
    }
    if (defaults.types) {
      nextManifest.types = defaults.types;
    }
    if (defaults.source) {
      nextManifest.source = defaults.source;
    }
    if (defaults.files) {
      nextManifest.files = defaults.files;
    }
  }

  if (defaults.repository) {
    nextManifest.repository = defaults.repository;
  }

  nextManifest.scripts = nextManifest.scripts ?? {};
  if (!toolingPackage) {
    for (const [scriptName, scriptCommand] of Object.entries(defaultScripts)) {
      if (!nextManifest.scripts[scriptName]) {
        nextManifest.scripts[scriptName] = scriptCommand;
      }
    }
  }
  nextManifest.scripts = sortRecord(nextManifest.scripts);

  if (!toolingPackage) {
    nextManifest.peerDependencies = nextManifest.peerDependencies ?? {};
    for (const [peerName, peerVersion] of Object.entries(defaultPeerDependencies)) {
      nextManifest.peerDependencies[peerName] = peerVersion;
    }
    nextManifest.peerDependencies = sortRecord(nextManifest.peerDependencies);
  } else if (
    nextManifest.peerDependencies &&
    typeof nextManifest.peerDependencies === "object" &&
    !Array.isArray(nextManifest.peerDependencies)
  ) {
    nextManifest.peerDependencies = sortRecord(nextManifest.peerDependencies);
  }

  coerceInternalDependencySpec(nextManifest, internalNames, internalDependencySpec);

  for (const field of dependencyFields()) {
    if (nextManifest[field] && typeof nextManifest[field] === "object" && !Array.isArray(nextManifest[field])) {
      nextManifest[field] = sortRecord(nextManifest[field]);
    }
  }

  const normalizedManifest = normalizePackageManifest(nextManifest);
  if (JSON.stringify(pkg.manifest) !== JSON.stringify(normalizedManifest)) {
    writeJson(pkg.manifestPath, normalizedManifest);
    manifestUpdates += 1;
  }
}

const typecheckPathPackages = packages.filter((pkg) => !isToolingPackage(policy, pkg.manifest.name));
const expectedTypecheckTsconfig = createTypecheckTsconfig(typecheckPathPackages);

let typecheckUpdates = 0;
for (const pkg of packages) {
  if (isToolingPackage(policy, pkg.manifest.name)) {
    continue;
  }

  const typecheckPath = path.join(pkg.dirPath, "tsconfig.typecheck.json");
  const currentTypecheck = fileExists(typecheckPath) ? readJson<unknown>(typecheckPath) : null;
  if (!jsonEqual(currentTypecheck, expectedTypecheckTsconfig)) {
    writeJson(typecheckPath, expectedTypecheckTsconfig);
    typecheckUpdates += 1;
  }
}

const updatedPathMapFiles: string[] = [];
for (const configPath of listPathMapFiles(apps)) {
  if (!fileExists(configPath)) {
    continue;
  }

  const config = readJson<PathMapTsconfig>(configPath);
  const compilerOptions = config.compilerOptions;
  const paths = compilerOptions?.paths;
  if (!compilerOptions || !paths) {
    continue;
  }

  const baseDir = path.resolve(path.dirname(configPath), compilerOptions.baseUrl ?? ".");
  const additions = typecheckPathPackages
    .filter((pkg) => paths[pkg.manifest.name] === undefined)
    .map((pkg): [string, string[]] => [
      pkg.manifest.name,
      [
        path
          .relative(baseDir, path.join(pkg.dirPath, "src", "index.ts"))
          .split(path.sep)
          .join("/"),
      ],
    ]);
  if (additions.length === 0) {
    continue;
  }

  compilerOptions.paths = insertPathEntries(paths, additions);
  writeJson(configPath, config);
  updatedPathMapFiles.push(configPath);
}

if (updatedPathMapFiles.length > 0) {
  // writeJson expands every array; let Biome restore the repository's formatting of these tsconfigs.
  const formatResult = spawnSync("pnpm", ["exec", "biome", "format", "--write", ...updatedPathMapFiles], {
    cwd: ROOT_DIR,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (formatResult.status !== 0) {
    console.warn("Could not format the updated tsconfig paths maps; run pnpm format.");
  }
}

const changesetDir = path.join(ROOT_DIR, ".changeset");
ensureDir(changesetDir);
const changesetConfigPath = path.join(changesetDir, "config.json");
const existingChangesetConfig = fileExists(changesetConfigPath)
  ? readJson<Partial<ChangesetConfig>>(changesetConfigPath)
  : {};

const publishPackageNames = packages.map((pkg) => pkg.manifest.name).sort((left, right) => left.localeCompare(right));
const ignoredPackageNames = apps.map((app) => app.manifest.name).sort((left, right) => left.localeCompare(right));
const expectedChangesetConfig = buildChangesetConfig(existingChangesetConfig, {
  access: policy.changesets?.access ?? "public",
  baseBranch: policy.changesets?.baseBranch ?? "main",
  ignore: ignoredPackageNames,
  fixed: publishPackageNames.length > 0 ? [publishPackageNames] : [],
});

let changesetUpdated = false;
if (!jsonEqual(existingChangesetConfig, expectedChangesetConfig)) {
  writeJson(changesetConfigPath, expectedChangesetConfig);
  changesetUpdated = true;
}

console.log(`Synced package manifests: ${manifestUpdates}`);
console.log(`Synced tsconfig.typecheck.json files: ${typecheckUpdates}`);
console.log(`Synced tsconfig paths maps: ${updatedPathMapFiles.length}`);
console.log(`Synced .changeset/config.json: ${changesetUpdated ? "yes" : "no"}`);
