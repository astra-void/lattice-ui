import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const PACKAGE_ROOT = path.join(ROOT_DIR, "packages");
const APP_ROOT = path.join(ROOT_DIR, "apps");
const DEPENDENCY_FIELDS = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];

export function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function fileExists(filePath) {
  return fs.existsSync(filePath);
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function sortRecord(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return record;
  }

  const entries = Object.entries(record).sort(([left], [right]) => left.localeCompare(right));
  return Object.fromEntries(entries);
}

export function sortObject(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sortObject(item));
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));
    return Object.fromEntries(entries.map(([key, item]) => [key, sortObject(item)]));
  }

  return value;
}

function listWorkspaceEntries(rootDir) {
  if (!fileExists(rootDir)) {
    return [];
  }

  const entries = fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dirName = entry.name;
      const dirPath = path.join(rootDir, dirName);
      const manifestPath = path.join(dirPath, "package.json");
      if (!fileExists(manifestPath)) {
        return null;
      }

      const manifest = readJson(manifestPath);
      return { dirName, dirPath, manifestPath, manifest };
    })
    .filter((entry) => entry !== null);

  return entries.sort((left, right) => left.manifest.name.localeCompare(right.manifest.name));
}

export function listPackages() {
  return listWorkspaceEntries(PACKAGE_ROOT);
}

export function listApps() {
  return listWorkspaceEntries(APP_ROOT);
}

export function getPolicy() {
  const policyPath = path.join(ROOT_DIR, "workspace.policy.json");
  if (!fileExists(policyPath)) {
    throw new Error(`Missing workspace policy: ${policyPath}`);
  }

  return readJson(policyPath);
}

export function getLockedVersion(policy, packages) {
  if (policy.lockedVersion) {
    return policy.lockedVersion;
  }

  const versions = [...new Set(packages.map((pkg) => pkg.manifest.version).filter(Boolean))];
  if (versions.length === 0) {
    return "0.1.0";
  }

  return versions[0];
}

export function getInternalPackageNames(packages) {
  return new Set(packages.map((pkg) => pkg.manifest.name));
}

export function createWorkspacePaths(packages) {
  const pairs = packages
    .map((pkg) => [pkg.manifest.name, [`${pkg.dirName}/src/index.ts`]])
    .sort(([left], [right]) => left.localeCompare(right));
  return Object.fromEntries(pairs);
}

export function coerceInternalDependencySpec(manifest, internalNames, expectedSpec) {
  let changed = false;

  for (const field of DEPENDENCY_FIELDS) {
    const dependencies = manifest[field];
    if (!dependencies || typeof dependencies !== "object" || Array.isArray(dependencies)) {
      continue;
    }

    for (const [dependencyName, currentSpec] of Object.entries(dependencies)) {
      if (internalNames.has(dependencyName) && currentSpec !== expectedSpec) {
        dependencies[dependencyName] = expectedSpec;
        changed = true;
      }
    }

    const sortedDependencies = sortRecord(dependencies);
    if (!jsonEqual(sortedDependencies, dependencies)) {
      manifest[field] = sortedDependencies;
      changed = true;
    } else {
      manifest[field] = sortedDependencies;
    }
  }

  return changed;
}

export function normalizePackageManifest(manifest) {
  const preferredOrder = [
    "name",
    "version",
    "private",
    "description",
    "main",
    "types",
    "files",
    "scripts",
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
    "keywords",
    "author",
    "license",
    "repository",
    "homepage",
    "bugs",
    "engines",
  ];

  const ordered = {};
  for (const key of preferredOrder) {
    if (manifest[key] !== undefined) {
      ordered[key] = manifest[key];
    }
  }

  const remaining = Object.keys(manifest)
    .filter((key) => !preferredOrder.includes(key))
    .sort((left, right) => left.localeCompare(right));
  for (const key of remaining) {
    ordered[key] = manifest[key];
  }

  if (ordered.scripts && typeof ordered.scripts === "object" && !Array.isArray(ordered.scripts)) {
    ordered.scripts = sortRecord(ordered.scripts);
  }

  for (const field of DEPENDENCY_FIELDS) {
    if (ordered[field] && typeof ordered[field] === "object" && !Array.isArray(ordered[field])) {
      ordered[field] = sortRecord(ordered[field]);
    }
  }

  return ordered;
}

export function parseMajor(version) {
  const match = /^(\d+)\./.exec(version ?? "");
  if (!match) {
    return null;
  }

  return Number(match[1]);
}

export function jsonEqual(left, right) {
  return JSON.stringify(sortObject(left)) === JSON.stringify(sortObject(right));
}

export function dependencyFields() {
  return DEPENDENCY_FIELDS;
}
