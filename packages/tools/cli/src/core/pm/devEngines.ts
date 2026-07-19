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
 * Writes `devEngines.packageManager` without a version range.
 *
 * The range travels with the manager it was written for, so a repin drops it rather than carrying
 * it over to a manager that would reject it. Leaving `onFail` unset keeps npm's default, which is
 * to fail the install.
 */
function withDevEnginesPin(manifest: PackageJson, target: PackageManagerName, onFail?: unknown): PackageJson {
  const devEngines = { ...(manifest.devEngines as Record<string, unknown> | undefined) };
  const entry: Record<string, unknown> = { name: target };
  if (onFail !== undefined) {
    entry.onFail = onFail;
  }

  devEngines.packageManager = entry;
  return { ...manifest, devEngines };
}

export interface PlanPackageManagerPinOptions {
  /**
   * Adds a pin when the manifest carries none.
   *
   * Only the scaffolding commands set this: `create` and `init` decide how a project is set up, so
   * they own the pin. `add`, `remove` and `upgrade` operate on projects they did not scaffold and
   * stay repin-only, so they never introduce a pin a project never asked for.
   */
  create?: boolean;
}

/**
 * Rewrites pins that point at another package manager so `target` can install the project, and
 * optionally writes the initial pin for a project that has none.
 */
export function planPackageManagerPin(
  manifest: PackageJson,
  target: PackageManagerName,
  options?: PlanPackageManagerPinOptions,
): PackageManagerPinPlan {
  const existing = readPackageManagerPins(manifest);
  const previous = existing.filter((pin) => pin.name !== target);

  if (previous.length === 0) {
    // A manifest that already pins `target` is left alone; only a pinless one is written to.
    if (!options?.create || existing.length > 0) {
      return {
        changed: false,
        nextManifest: manifest,
        previous,
      };
    }

    return {
      changed: true,
      nextManifest: withDevEnginesPin(manifest, target),
      previous,
    };
  }

  let nextManifest: PackageJson = { ...manifest };

  for (const pin of previous) {
    if (pin.field === "devEngines") {
      nextManifest = withDevEnginesPin(nextManifest, target, readDevEnginesEntry(manifest)?.onFail);
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
