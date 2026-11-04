import { promises as fs } from "node:fs";
import * as path from "node:path";
import { LEGACY_PACKAGE_RENAMES } from "./legacyPackages";
import type { PackageJson } from "./readPackageJson";

/**
 * `@lattice-ui/*` packages are released in lockstep and depend on each other at exact versions,
 * so react-dialog@0.8.1 pulls react-layer@0.8.1. Installing one package at a different version
 * than the rest nests a second copy of the shared packages, and each copy creates its own React
 * contexts — providers from one copy are invisible to components from the other.
 */
export const LATTICE_SCOPE = "@lattice-ui/";

const EXACT_VERSION = /^(?:[~^=]|v)?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/;

export function isLatticePackage(name: string): boolean {
  return name.startsWith(LATTICE_SCOPE);
}

/** Current, non-renamed `@lattice-ui/*` names listed in the manifest's dependency fields. */
export function listInstalledLatticePackages(manifest: PackageJson): string[] {
  const names = new Set<string>();
  for (const field of ["dependencies", "devDependencies"] as const) {
    for (const name of Object.keys(manifest[field] ?? {})) {
      if (isLatticePackage(name) && LEGACY_PACKAGE_RENAMES[name] === undefined) {
        names.add(name);
      }
    }
  }

  return [...names].sort((left, right) => left.localeCompare(right));
}

/** Reads `version` from the nearest `node_modules/<name>/package.json`, walking up like Node does. */
async function readInstalledVersion(projectRoot: string, name: string): Promise<string | undefined> {
  let currentDir = path.resolve(projectRoot);

  while (true) {
    try {
      const raw = await fs.readFile(path.join(currentDir, "node_modules", name, "package.json"), "utf8");
      const version = (JSON.parse(raw) as { version?: unknown }).version;
      if (typeof version === "string" && EXACT_VERSION.test(version)) {
        return version;
      }
    } catch {
      // Not installed at this level; keep walking.
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return undefined;
    }
    currentDir = parentDir;
  }
}

/** `0.8.1`, `^0.8.1`, `~0.8.1` → `0.8.1`; anything looser (`workspace:*`, `latest`, ranges) → undefined. */
function versionFromSpecifier(specifier: string | undefined): string | undefined {
  return specifier?.trim().match(EXACT_VERSION)?.[1];
}

function parseVersion(version: string): number[] {
  return version
    .split("-")[0]
    .split(".")
    .map((part) => Number.parseInt(part, 10));
}

export function compareVersions(left: string, right: string): number {
  const leftParts = parseVersion(left);
  const rightParts = parseVersion(right);
  for (let index = 0; index < 3; index += 1) {
    const delta = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (delta !== 0) {
      return delta;
    }
  }

  // A prerelease sorts below its release.
  const leftPre = left.includes("-");
  const rightPre = right.includes("-");
  if (leftPre !== rightPre) {
    return leftPre ? -1 : 1;
  }

  return left.localeCompare(right);
}

export interface InstalledLatticeVersion {
  /** The version new `@lattice-ui/*` packages should be pinned to, when one is known. */
  version?: string;
  /** Every distinct version found, ascending. More than one means the project is already mixed. */
  versions: string[];
}

/**
 * The lockstep version the project is on. The installed copy in `node_modules` is the truth; the
 * manifest specifier is the fallback for a project that has not been installed yet.
 */
export async function resolveInstalledLatticeVersion(
  projectRoot: string,
  manifest: PackageJson,
): Promise<InstalledLatticeVersion> {
  const found = new Set<string>();
  for (const name of listInstalledLatticePackages(manifest)) {
    const specifier = manifest.dependencies?.[name] ?? manifest.devDependencies?.[name];
    const version = (await readInstalledVersion(projectRoot, name)) ?? versionFromSpecifier(specifier);
    if (version !== undefined) {
      found.add(version);
    }
  }

  const versions = [...found].sort(compareVersions);
  return { version: versions[versions.length - 1], versions };
}
