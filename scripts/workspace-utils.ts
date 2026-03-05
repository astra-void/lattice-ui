import * as fs from "node:fs";
import * as path from "node:path";

export const ROOT_DIR = path.resolve(__dirname, "..");

const PACKAGE_ROOT = path.join(ROOT_DIR, "packages");
const APP_ROOT = path.join(ROOT_DIR, "apps");
const DEPENDENCY_FIELDS = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"] as const;

export type DependencyField = (typeof DEPENDENCY_FIELDS)[number];

export interface PackageManifest {
  name: string;
  version?: string;
  private?: boolean;
  description?: string;
  main?: string;
  types?: string;
  files?: string[];
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  keywords?: string[];
  author?: string;
  license?: string;
  repository?: string | Record<string, unknown>;
  homepage?: string;
  bugs?: string | Record<string, unknown>;
  engines?: Record<string, string>;
  [key: string]: unknown;
}

export interface WorkspaceEntry {
  dirName: string;
  dirPath: string;
  manifestPath: string;
  manifest: PackageManifest;
}

interface LockedstepPolicy {
  enforced?: boolean;
  major?: number;
}

interface PackageDefaultsPolicy {
  private?: boolean;
  main?: string;
  types?: string;
  scripts?: Record<string, string>;
}

interface ChangesetsPolicy {
  baseBranch?: string;
  access?: string;
}

export interface WorkspacePolicy {
  internalScope?: string;
  internalDependencyVersion?: string;
  lockedVersion?: string;
  lockedstep?: LockedstepPolicy;
  packageDefaults?: PackageDefaultsPolicy;
  defaultPeerDependencies?: Record<string, string>;
  defaultDevDependencies?: Record<string, string>;
  toolingPackages?: string[];
  requiredFiles?: string[];
  changesets?: ChangesetsPolicy;
  [key: string]: unknown;
}

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export function readJson<T = unknown>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function sortRecord<T extends Record<string, string> | null | undefined>(record: T): T {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return record;
  }

  const entries = Object.entries(record).sort(([left], [right]) => left.localeCompare(right));
  return Object.fromEntries(entries) as T;
}

export function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortObject(item));
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));
    return Object.fromEntries(entries.map(([key, item]) => [key, sortObject(item)]));
  }

  return value;
}

function readPackageManifest(manifestPath: string): PackageManifest {
  const manifest = readJson<Record<string, unknown>>(manifestPath);
  if (typeof manifest.name !== "string" || manifest.name.length === 0) {
    throw new Error(`Invalid package manifest without a name: ${manifestPath}`);
  }

  return manifest as PackageManifest;
}

function listWorkspaceEntries(rootDir: string): WorkspaceEntry[] {
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

      const manifest = readPackageManifest(manifestPath);
      return { dirName, dirPath, manifestPath, manifest };
    })
    .filter((entry): entry is WorkspaceEntry => entry !== null);

  return entries.sort((left, right) => left.manifest.name.localeCompare(right.manifest.name));
}

export function listPackages(): WorkspaceEntry[] {
  return listWorkspaceEntries(PACKAGE_ROOT);
}

export function listApps(): WorkspaceEntry[] {
  return listWorkspaceEntries(APP_ROOT);
}

export function getPolicy(): WorkspacePolicy {
  const policyPath = path.join(ROOT_DIR, "workspace.policy.json");
  if (!fileExists(policyPath)) {
    throw new Error(`Missing workspace policy: ${policyPath}`);
  }

  return readJson<WorkspacePolicy>(policyPath);
}

export function isToolingPackage(policy: WorkspacePolicy, packageName: string): boolean {
  if (!Array.isArray(policy.toolingPackages)) {
    return false;
  }

  return policy.toolingPackages.includes(packageName);
}

export function getLockedVersion(policy: WorkspacePolicy, packages: WorkspaceEntry[]): string {
  if (policy.lockedVersion) {
    return policy.lockedVersion;
  }

  const versions = [
    ...new Set(
      packages
        .map((pkg) => pkg.manifest.version)
        .filter((version): version is string => typeof version === "string" && version.length > 0),
    ),
  ];
  if (versions.length === 0) {
    return "0.1.0";
  }

  return versions[0];
}

export function getInternalPackageNames(packages: WorkspaceEntry[]): Set<string> {
  return new Set(packages.map((pkg) => pkg.manifest.name));
}

export function createWorkspacePaths(packages: WorkspaceEntry[]): Record<string, string[]> {
  const pairs: Array<[string, string[]]> = packages
    .map((pkg): [string, string[]] => [pkg.manifest.name, [`${pkg.dirName}/src/index.ts`]])
    .sort(([left], [right]) => left.localeCompare(right));
  return Object.fromEntries(pairs);
}

export function coerceInternalDependencySpec(
  manifest: PackageManifest,
  internalNames: Set<string>,
  expectedSpec: string,
): boolean {
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

    const sortedDependencies = sortRecord(dependencies) as Record<string, string>;
    if (!jsonEqual(sortedDependencies, dependencies)) {
      manifest[field] = sortedDependencies;
      changed = true;
    } else {
      manifest[field] = sortedDependencies;
    }
  }

  return changed;
}

export function normalizePackageManifest(manifest: PackageManifest): PackageManifest {
  const preferredOrder: Array<keyof PackageManifest> = [
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

  const ordered: PackageManifest = {
    name: manifest.name,
  };
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
    ordered.scripts = sortRecord(ordered.scripts) as Record<string, string>;
  }

  for (const field of DEPENDENCY_FIELDS) {
    if (ordered[field] && typeof ordered[field] === "object" && !Array.isArray(ordered[field])) {
      ordered[field] = sortRecord(ordered[field] as Record<string, string>) as Record<string, string>;
    }
  }

  return ordered;
}

export function parseMajor(version: string | undefined): number | null {
  const match = /^(\d+)\./.exec(version ?? "");
  if (!match) {
    return null;
  }

  return Number(match[1]);
}

export function jsonEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(sortObject(left)) === JSON.stringify(sortObject(right));
}

export function dependencyFields(): readonly DependencyField[] {
  return DEPENDENCY_FIELDS;
}
