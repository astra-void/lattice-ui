import type { PackageJson } from "./readPackageJson";

/**
 * Packages published under the pre-0.6.1 unprefixed names. The 0.6.1 rename moved every
 * package under a framework layer, and a manifest that still lists an old name installs a
 * stale copy alongside its replacement, which npm then rejects on peer resolution.
 */
const RENAMED_COMPONENT_SLUGS = [
  "accordion",
  "avatar",
  "checkbox",
  "combobox",
  "context-menu",
  "dialog",
  "focus",
  "layer",
  "menu",
  "motion",
  "popover",
  "popper",
  "progress",
  "radio-group",
  "scroll-area",
  "select",
  "slider",
  "style",
  "switch",
  "system",
  "tabs",
  "text-field",
  "textarea",
  "toast",
  "toggle-group",
  "tooltip",
] as const;

export const LEGACY_PACKAGE_RENAMES: Record<string, string> = {
  // The runtime package was renamed, not just re-scoped.
  "@lattice-ui/core": "@lattice-ui/react-runtime",
  ...Object.fromEntries(RENAMED_COMPONENT_SLUGS.map((slug) => [`@lattice-ui/${slug}`, `@lattice-ui/react-${slug}`])),
};

const MIGRATED_FIELDS = ["dependencies", "devDependencies"] as const;

type MigratedField = (typeof MIGRATED_FIELDS)[number];

export interface LegacyPackageMigration {
  from: string;
  to: string;
  field: MigratedField;
  /** False when the replacement was already listed and only the legacy entry was dropped. */
  added: boolean;
}

export interface LegacyPackageMigrationPlan {
  changed: boolean;
  nextManifest: PackageJson;
  migrations: LegacyPackageMigration[];
  /** Replacements the caller must resolve a version for before the plan can add them. */
  unresolved: string[];
}

function sortRecord(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(record).sort(([left], [right]) => left.localeCompare(right)));
}

/** Legacy package names listed in the manifest, in sorted order. */
export function findLegacyPackages(manifest: PackageJson): string[] {
  const names = new Set<string>();

  for (const field of MIGRATED_FIELDS) {
    for (const name of Object.keys(manifest[field] ?? {})) {
      if (LEGACY_PACKAGE_RENAMES[name] !== undefined) {
        names.add(name);
      }
    }
  }

  return [...names].sort((left, right) => left.localeCompare(right));
}

/** Replacement package names that a migration would have to install. */
export function resolveLegacyReplacements(manifest: PackageJson): string[] {
  return [...new Set(findLegacyPackages(manifest).map((name) => LEGACY_PACKAGE_RENAMES[name]))].sort((left, right) =>
    left.localeCompare(right),
  );
}

/**
 * Drops legacy package names and lists their replacements instead. A replacement that is
 * already present keeps its existing version; a new one needs a version from `versions`.
 */
export function planLegacyPackageMigration(
  manifest: PackageJson,
  versions: Record<string, string>,
): LegacyPackageMigrationPlan {
  const legacyNames = findLegacyPackages(manifest);
  if (legacyNames.length === 0) {
    return {
      changed: false,
      nextManifest: manifest,
      migrations: [],
      unresolved: [],
    };
  }

  const nextManifest: PackageJson = { ...manifest };
  const migrations: LegacyPackageMigration[] = [];
  const unresolved: string[] = [];

  const listedNames = new Set<string>();
  for (const field of MIGRATED_FIELDS) {
    for (const name of Object.keys(manifest[field] ?? {})) {
      listedNames.add(name);
    }
  }

  for (const field of MIGRATED_FIELDS) {
    const current = manifest[field];
    if (!current) {
      continue;
    }

    const next = { ...current };
    let fieldChanged = false;

    for (const [name, version] of Object.entries(current)) {
      const replacement = LEGACY_PACKAGE_RENAMES[name];
      if (replacement === undefined) {
        continue;
      }

      delete next[name];
      fieldChanged = true;

      if (listedNames.has(replacement)) {
        migrations.push({ from: name, to: replacement, field, added: false });
        continue;
      }

      const replacementVersion = versions[replacement];
      if (replacementVersion === undefined) {
        // Keep the legacy entry rather than dropping a dependency we cannot replace.
        next[name] = version;
        unresolved.push(replacement);
        continue;
      }

      next[replacement] = replacementVersion;
      listedNames.add(replacement);
      migrations.push({ from: name, to: replacement, field, added: true });
    }

    if (fieldChanged) {
      nextManifest[field] = sortRecord(next);
    }
  }

  const changed = migrations.length > 0;

  return {
    changed,
    nextManifest: changed ? nextManifest : manifest,
    migrations,
    unresolved: [...new Set(unresolved)].sort((left, right) => left.localeCompare(right)),
  };
}
