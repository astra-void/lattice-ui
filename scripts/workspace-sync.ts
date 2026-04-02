#!/usr/bin/env node

import * as path from "node:path";
import {
  coerceInternalDependencySpec,
  createWorkspacePaths,
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
  normalizePackageManifest,
  type PackageManifest,
  ROOT_DIR,
  readJson,
  sortRecord,
  writeJson,
} from "./workspace-utils";

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
const expectedPaths = createWorkspacePaths(typecheckPathPackages);
const expectedTypecheckTsconfig = {
  extends: "./tsconfig.json",
  compilerOptions: {
    noEmit: true,
    baseUrl: "..",
    rootDir: "..",
    paths: expectedPaths,
  },
};

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
console.log(`Synced .changeset/config.json: ${changesetUpdated ? "yes" : "no"}`);
