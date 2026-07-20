import * as os from "node:os";
import * as path from "node:path";
import type { PackageManagerResolutionSource } from "./pm/detect";
import type { PackageManagerName } from "./pm/types";
import { hyperlink } from "./style";

const RESOLUTION_LABELS: Record<PackageManagerResolutionSource, string> = {
  override: "--pm",
  lockfile: "lockfile",
  manifest: "packageManager field",
  installed: "only installed",
  prompt: "selected",
};

/** Renders the resolved manager plus why it was chosen, e.g. `npm · lockfile`. */
export function describePackageManager(pmName: PackageManagerName, source: PackageManagerResolutionSource): string {
  return `${pmName} · ${RESOLUTION_LABELS[source]}`;
}

/**
 * Shortens an absolute path for display: relative to `cwd` when it lives underneath, `~` when it
 * lives under the home directory. A full project path otherwise eats a whole terminal line.
 */
export function shortenPath(target: string, cwd = process.cwd(), home = os.homedir()): string {
  const relative = path.relative(cwd, target);

  // `.` would be accurate for the current directory but tells the reader nothing about *which*
  // project is being touched, so only a genuine subpath is rendered relative.
  if (relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative)) {
    return relative;
  }

  if (home.length > 0 && (target === home || target.startsWith(`${home}${path.sep}`))) {
    return `~${target.slice(home.length)}`;
  }

  return target;
}

/** A shortened, clickable path. Terminals without OSC 8 support see the label alone. */
export function linkPath(target: string, cwd?: string): string {
  return hyperlink(shortenPath(target, cwd), `file://${target}`);
}

/**
 * A clickable package name pointing at its npm page.
 *
 * Specs arrive as `name`, `name@version` or `@scope/name@latest`; only the name part is used for
 * the URL, and the whole spec stays visible.
 */
export function linkPackage(spec: string): string {
  const separator = spec.lastIndexOf("@");
  const name = separator > 0 ? spec.slice(0, separator) : spec;
  return hyperlink(spec, `https://www.npmjs.com/package/${name}`);
}

/** `plural(1, "error")` → `error`; `plural(3, "error")` → `errors`. */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return count === 1 ? singular : pluralForm;
}

/** Rows shown before a block collapses into `…and N more`. */
export const ITEM_LIMIT = 8;

export interface SummarizedItems {
  total: number;
  visible: string[];
  hidden: number;
}

export function resolveLocalLatticeCommand(pmName: PackageManagerName): string {
  if (pmName === "npm") {
    return "npx lattice-ui";
  }

  return `${pmName} lattice`;
}

export function summarizeItems(items: string[], limit = 8): SummarizedItems {
  const normalizedLimit = Math.max(0, Math.floor(limit));
  const uniqueItems = [...new Set(items)];
  const visible = uniqueItems.slice(0, normalizedLimit);
  return {
    total: uniqueItems.length,
    visible,
    hidden: Math.max(0, uniqueItems.length - visible.length),
  };
}
