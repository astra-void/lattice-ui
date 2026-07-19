import type { PackageJson } from "../project/readPackageJson";
import type { PackageManagerName } from "./types";

export type PackageManagerPinField = "devEngines" | "packageManager";

export interface PackageManagerPin {
  name: PackageManagerName;
  field: PackageManagerPinField;
}

export interface PackageManagerPinPlan {
  changed: boolean;
  nextManifest: PackageJson;
  previous: PackageManagerPin[];
}

interface DevEnginesPackageManager {
  name?: unknown;
  version?: unknown;
  onFail?: unknown;
}

const supportedManagers: PackageManagerName[] = ["npm", "pnpm", "yarn"];

function isSupportedManager(value: unknown): value is PackageManagerName {
  return typeof value === "string" && supportedManagers.includes(value as PackageManagerName);
}

function readDevEnginesEntry(manifest: PackageJson): DevEnginesPackageManager | undefined {
  const devEngines = manifest.devEngines;
  if (!devEngines || typeof devEngines !== "object" || Array.isArray(devEngines)) {
    return undefined;
  }

  const entry = (devEngines as Record<string, unknown>).packageManager;
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    return undefined;
  }

  return entry as DevEnginesPackageManager;
}

function readPackageManagerField(manifest: PackageJson): PackageManagerName | undefined {
  const value = manifest.packageManager;
  if (typeof value !== "string") {
    return undefined;
  }

  const name = value.split("@")[0]?.trim();
  return isSupportedManager(name) ? name : undefined;
}

/**
 * Reads the package manager a project pins itself to.
 *
 * `pnpm init` writes `devEngines.packageManager`, and both npm and pnpm refuse to install when the
 * running package manager does not match it, so the pin decides which manager can touch the project.
 */
export function readPackageManagerPins(manifest: PackageJson): PackageManagerPin[] {
  const pins: PackageManagerPin[] = [];

  const devEnginesName = readDevEnginesEntry(manifest)?.name;
  if (isSupportedManager(devEnginesName)) {
    pins.push({ name: devEnginesName, field: "devEngines" });
  }

  const fieldName = readPackageManagerField(manifest);
  if (fieldName) {
    pins.push({ name: fieldName, field: "packageManager" });
  }

  return pins;
}

/**
 * Rewrites pins that point at another package manager so `target` can install the project.
 *
 * The version range travels with the manager it was written for, so it is dropped rather than
 * carried over to a manager that would reject it.
 */
export function planPackageManagerPin(manifest: PackageJson, target: PackageManagerName): PackageManagerPinPlan {
  const previous = readPackageManagerPins(manifest).filter((pin) => pin.name !== target);
  if (previous.length === 0) {
    return {
      changed: false,
      nextManifest: manifest,
      previous,
    };
  }

  const nextManifest: PackageJson = { ...manifest };

  for (const pin of previous) {
    if (pin.field === "devEngines") {
      const devEngines = { ...(nextManifest.devEngines as Record<string, unknown>) };
      const entry = readDevEnginesEntry(manifest) ?? {};
      const nextEntry: Record<string, unknown> = { name: target };
      if (entry.onFail !== undefined) {
        nextEntry.onFail = entry.onFail;
      }

      devEngines.packageManager = nextEntry;
      nextManifest.devEngines = devEngines;
      continue;
    }

    delete nextManifest.packageManager;
  }

  return {
    changed: true,
    nextManifest,
    previous,
  };
}

export function describePackageManagerPin(pin: PackageManagerPin): string {
  return pin.field === "devEngines" ? `devEngines.packageManager (${pin.name})` : `packageManager (${pin.name})`;
}
