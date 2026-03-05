import { registryInvalidError } from "../errors";

export interface RegistryPackageEntry {
  npm: string;
  peers?: string[];
  providers?: string[];
  notes?: string[];
}

export interface Registry {
  packages: Record<string, RegistryPackageEntry>;
  presets: Record<string, string[]>;
}

export interface ProviderRequirement {
  raw: string;
  packageName: string;
  providerName?: string;
  optional: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function readStringArray(value: unknown, path: string): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isStringArray(value)) {
    throw registryInvalidError(`${path} must be an array of strings.`);
  }

  return value.slice();
}

export function parseProviderRequirement(rawValue: string): ProviderRequirement {
  const optional = rawValue.endsWith("?");
  const normalized = optional ? rawValue.slice(0, -1) : rawValue;
  const [packageName, providerName] = normalized.split(":");

  if (!packageName || packageName.trim().length === 0) {
    throw registryInvalidError(`Invalid provider requirement "${rawValue}".`);
  }

  return {
    raw: rawValue,
    packageName,
    providerName: providerName && providerName.length > 0 ? providerName : undefined,
    optional,
  };
}

export function validateRegistry(componentsSource: unknown, presetsSource: unknown): Registry {
  if (!isRecord(componentsSource)) {
    throw registryInvalidError("components.json must be an object.");
  }

  if (!isRecord(presetsSource)) {
    throw registryInvalidError("presets.json must be an object.");
  }

  const packagesSource = componentsSource.packages;
  if (!isRecord(packagesSource)) {
    throw registryInvalidError("components.json.packages must be an object.");
  }

  const packages: Record<string, RegistryPackageEntry> = {};
  for (const [componentName, rawEntry] of Object.entries(packagesSource)) {
    if (!isRecord(rawEntry)) {
      throw registryInvalidError(`components.json.packages.${componentName} must be an object.`);
    }

    if (typeof rawEntry.npm !== "string" || rawEntry.npm.length === 0) {
      throw registryInvalidError(`components.json.packages.${componentName}.npm must be a non-empty string.`);
    }

    const peers = readStringArray(rawEntry.peers, `components.json.packages.${componentName}.peers`);
    const providers = readStringArray(rawEntry.providers, `components.json.packages.${componentName}.providers`);
    const notes = readStringArray(rawEntry.notes, `components.json.packages.${componentName}.notes`);

    if (providers) {
      for (const provider of providers) {
        parseProviderRequirement(provider);
      }
    }

    packages[componentName] = {
      npm: rawEntry.npm,
      peers,
      providers,
      notes,
    };
  }

  const presetsContainer = presetsSource.presets;
  if (!isRecord(presetsContainer)) {
    throw registryInvalidError("presets.json.presets must be an object.");
  }

  const presets: Record<string, string[]> = {};
  for (const [presetName, rawPreset] of Object.entries(presetsContainer)) {
    if (!isStringArray(rawPreset)) {
      throw registryInvalidError(`presets.json.presets.${presetName} must be an array of component names.`);
    }

    const presetMembers = rawPreset.slice();
    for (const componentName of presetMembers) {
      if (!packages[componentName]) {
        throw registryInvalidError(
          `presets.json.presets.${presetName} references unknown component "${componentName}".`,
        );
      }
    }

    presets[presetName] = presetMembers;
  }

  return { packages, presets };
}
