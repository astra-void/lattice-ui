#!/usr/bin/env node

import * as path from "node:path";
import {
  createWorkspacePaths,
  dependencyFields,
  fileExists,
  getInternalPackageNames,
  getLockedVersion,
  getPolicy,
  isToolingPackage,
  jsonEqual,
  listApps,
  listPackages,
  parseMajor,
  ROOT_DIR,
  readJson,
} from "./workspace-utils";

interface ChangesetConfig {
  baseBranch?: string;
  access?: string;
  ignore?: string[];
  fixed?: unknown;
}

function normalizeFixed(fixedValue: unknown): string[][] {
  if (!Array.isArray(fixedValue)) {
    return [];
  }

  return fixedValue
    .map((group) =>
      Array.isArray(group)
        ? group
            .filter((item): item is string => typeof item === "string")
            .sort((left, right) => left.localeCompare(right))
        : [],
    )
    .sort((left, right) => left.join(",").localeCompare(right.join(",")));
}

const policy = getPolicy();
const packages = listPackages();
const apps = listApps();
const errors: string[] = [];

if (packages.length === 0) {
  errors.push("No packages were found in packages/*.");
}

const internalNames = getInternalPackageNames(packages);
const expectedDependencySpec = policy.internalDependencyVersion ?? "workspace:*";
const lockedVersion = getLockedVersion(policy, packages);
const requiredFiles = policy.requiredFiles ?? ["src/index.ts", "tsconfig.json", "tsconfig.typecheck.json"];
const defaultPeerDependencies = policy.defaultPeerDependencies ?? {};
const requiredScripts = policy.packageDefaults?.scripts ?? {};
const typecheckPathPackages = packages.filter((pkg) => !isToolingPackage(policy, pkg.manifest.name));
const expectedTypecheckTsconfig = {
  extends: "./tsconfig.json",
  compilerOptions: {
    noEmit: true,
    baseUrl: "..",
    rootDir: "..",
    paths: createWorkspacePaths(typecheckPathPackages),
  },
};

const versionSet = new Set(
  packages
    .map((pkg) => pkg.manifest.version)
    .filter((version): version is string => typeof version === "string" && version.length > 0),
);
if (versionSet.size > 1) {
  errors.push(
    `Lockedstep violation: expected exactly one version across packages, found ${[...versionSet].join(", ")}.`,
  );
}

if (policy.lockedstep?.enforced !== false) {
  for (const pkg of packages) {
    if (pkg.manifest.version !== lockedVersion) {
      errors.push(`${pkg.manifest.name} has version ${pkg.manifest.version}, expected ${lockedVersion}.`);
    }
  }
}

if (typeof policy.lockedstep?.major === "number") {
  for (const pkg of packages) {
    const major = parseMajor(pkg.manifest.version);
    if (major !== policy.lockedstep.major) {
      errors.push(
        `${pkg.manifest.name} version ${pkg.manifest.version} must stay on major ${policy.lockedstep.major}.`,
      );
    }
  }
}

for (const pkg of packages) {
  const toolingPackage = isToolingPackage(policy, pkg.manifest.name);

  if (!toolingPackage) {
    for (const requiredFile of requiredFiles) {
      const targetPath = path.join(pkg.dirPath, requiredFile);
      if (!fileExists(targetPath)) {
        errors.push(`${pkg.manifest.name} is missing required file: ${requiredFile}.`);
      }
    }
  }

  const defaults = policy.packageDefaults ?? {};
  if (typeof defaults.private === "boolean" && pkg.manifest.private !== defaults.private) {
    errors.push(`${pkg.manifest.name} has private=${pkg.manifest.private} but expected ${defaults.private}.`);
  }

  if (!toolingPackage) {
    if (defaults.main && pkg.manifest.main !== defaults.main) {
      errors.push(`${pkg.manifest.name} has main="${pkg.manifest.main}" but expected "${defaults.main}".`);
    }
    if (defaults.types && pkg.manifest.types !== defaults.types) {
      errors.push(`${pkg.manifest.name} has types="${pkg.manifest.types}" but expected "${defaults.types}".`);
    }
    if (defaults.source && pkg.manifest.source !== defaults.source) {
      errors.push(`${pkg.manifest.name} has source="${pkg.manifest.source}" but expected "${defaults.source}".`);
    }
    if (defaults.files && !jsonEqual(pkg.manifest.files, defaults.files)) {
      errors.push(`${pkg.manifest.name} has non-canonical files array. Run "pnpm workspace:sync".`);
    }
    if (defaults.repository && !jsonEqual(pkg.manifest.repository, defaults.repository)) {
      errors.push(`${pkg.manifest.name} has a non-canonical repository field. Run "pnpm workspace:sync".`);
    }

    for (const [scriptName, scriptCommand] of Object.entries(requiredScripts)) {
      if (!pkg.manifest.scripts?.[scriptName]) {
        errors.push(`${pkg.manifest.name} is missing required script "${scriptName}".`);
        continue;
      }

      if (scriptName === "typecheck" && pkg.manifest.scripts[scriptName] !== scriptCommand) {
        errors.push(
          `${pkg.manifest.name} has typecheck script "${pkg.manifest.scripts[scriptName]}" but expected "${scriptCommand}".`,
        );
      }
    }

    for (const [peerName, peerVersion] of Object.entries(defaultPeerDependencies)) {
      if (pkg.manifest.peerDependencies?.[peerName] !== peerVersion) {
        errors.push(`${pkg.manifest.name} must define peerDependencies.${peerName} as "${peerVersion}".`);
      }
    }
  }

  for (const dependencyField of dependencyFields()) {
    const dependencyMap = pkg.manifest[dependencyField];
    if (!dependencyMap || typeof dependencyMap !== "object" || Array.isArray(dependencyMap)) {
      continue;
    }

    for (const [dependencyName, dependencySpec] of Object.entries(dependencyMap)) {
      if (!internalNames.has(dependencyName)) {
        continue;
      }

      if (dependencySpec !== expectedDependencySpec) {
        errors.push(
          `${pkg.manifest.name} has ${dependencyField}.${dependencyName}="${dependencySpec}" but expected "${expectedDependencySpec}".`,
        );
      }
    }
  }

  if (!toolingPackage) {
    const typecheckPath = path.join(pkg.dirPath, "tsconfig.typecheck.json");
    if (fileExists(typecheckPath)) {
      const typecheckConfig = readJson<unknown>(typecheckPath);
      if (!jsonEqual(typecheckConfig, expectedTypecheckTsconfig)) {
        errors.push(`${pkg.manifest.name} has a non-canonical tsconfig.typecheck.json. Run "pnpm workspace:sync".`);
      }
    }
  }
}

const changesetConfigPath = path.join(ROOT_DIR, ".changeset", "config.json");
if (!fileExists(changesetConfigPath)) {
  errors.push("Missing .changeset/config.json.");
} else {
  const changesetConfig = readJson<ChangesetConfig>(changesetConfigPath);
  const expectedBaseBranch = policy.changesets?.baseBranch ?? "main";
  const expectedAccess = policy.changesets?.access ?? "public";

  if (changesetConfig.baseBranch !== expectedBaseBranch) {
    errors.push(`.changeset/config.json baseBranch must be "${expectedBaseBranch}".`);
  }
  if (changesetConfig.access !== expectedAccess) {
    errors.push(`.changeset/config.json access must be "${expectedAccess}".`);
  }

  const expectedIgnore = apps.map((app) => app.manifest.name).sort((left, right) => left.localeCompare(right));
  const actualIgnore = Array.isArray(changesetConfig.ignore)
    ? [...changesetConfig.ignore].sort((left, right) => left.localeCompare(right))
    : [];
  if (!jsonEqual(expectedIgnore, actualIgnore)) {
    errors.push(`.changeset/config.json ignore must match app package names: ${expectedIgnore.join(", ")}.`);
  }

  const expectedFixed = [packages.map((pkg) => pkg.manifest.name).sort((left, right) => left.localeCompare(right))];
  const actualFixed = normalizeFixed(changesetConfig.fixed);
  if (!jsonEqual(normalizeFixed(expectedFixed), actualFixed)) {
    errors.push(".changeset/config.json fixed must contain a single lockedstep group with all publish packages.");
  }
}

if (errors.length > 0) {
  console.error("Workspace policy check failed:");
  for (const [index, error] of errors.entries()) {
    console.error(`${index + 1}. ${error}`);
  }
  process.exit(1);
}

console.log("Workspace policy check passed.");
