export type DependencyField = "dependencies" | "devDependencies" | "peerDependencies" | "optionalDependencies";

export type PackageJsonLike = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  [key: string]: unknown;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sortRecord(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(record).sort(([left], [right]) => left.localeCompare(right)));
}

export function toPackageName(spec: string): string {
  if (spec.startsWith("@")) {
    const slashIndex = spec.indexOf("/");
    if (slashIndex < 0) {
      return spec;
    }

    const versionIndex = spec.indexOf("@", slashIndex + 1);
    return versionIndex < 0 ? spec : spec.slice(0, versionIndex);
  }

  const versionIndex = spec.indexOf("@");
  return versionIndex < 0 ? spec : spec.slice(0, versionIndex);
}

export function getDependencyNames(manifest: PackageJsonLike): Set<string> {
  const names = new Set<string>();

  for (const field of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"] as const) {
    const dependencies = manifest[field];
    if (!dependencies || typeof dependencies !== "object") {
      continue;
    }

    for (const name of Object.keys(dependencies)) {
      names.add(name);
    }
  }

  return names;
}

export function upsertDependencySpecs(
  manifest: PackageJsonLike,
  field: DependencyField,
  specs: string[],
): { changed: boolean; added: string[] } {
  const dependencyMap = { ...(manifest[field] ?? {}) };
  let changed = false;
  const added: string[] = [];

  for (const spec of specs) {
    const packageName = toPackageName(spec);
    if (!packageName) {
      continue;
    }

    if (dependencyMap[packageName] !== spec) {
      dependencyMap[packageName] = spec;
      changed = true;
    }

    if (!added.includes(packageName)) {
      added.push(packageName);
    }
  }

  manifest[field] = sortRecord(dependencyMap);
  return { changed, added };
}

export function mergeStringArraysUnique(existing: string[] | undefined, incoming: string[]): string[] {
  const out = [...(existing ?? [])];
  for (const value of incoming) {
    if (!out.includes(value)) {
      out.push(value);
    }
  }

  return out;
}

export function mergeMissing(template: unknown, current: unknown): unknown {
  if (current === undefined) {
    return template;
  }

  if (Array.isArray(template) || Array.isArray(current)) {
    return current;
  }

  if (!isPlainObject(template) || !isPlainObject(current)) {
    return current;
  }

  const out: Record<string, unknown> = { ...current };
  for (const [key, templateValue] of Object.entries(template)) {
    out[key] = mergeMissing(templateValue, current[key]);
  }

  return out;
}
