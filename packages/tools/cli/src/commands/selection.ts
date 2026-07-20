import { usageError } from "../core/errors";
import type { Registry } from "../core/registry/schema";
import { didYouMean } from "../core/suggest";

export interface SelectionInput {
  names: string[];
  presets: string[];
}

/** Only the registry is needed, so selections can be validated before a CliContext exists. */
export interface SelectionSource {
  registry: Registry;
}

export function resolveComponentSelection(source: SelectionSource, input: SelectionInput): string[] {
  const selected = new Set<string>();
  const componentNames = Object.keys(source.registry.packages);
  const presetNames = Object.keys(source.registry.presets).sort((left, right) => left.localeCompare(right));

  for (const name of input.names) {
    if (!source.registry.packages[name]) {
      throw usageError(
        `Unknown component: ${name}`,
        didYouMean(name, componentNames),
        "Run `lattice add --help` for the full component list.",
      );
    }
    selected.add(name);
  }

  for (const preset of input.presets) {
    const presetMembers = source.registry.presets[preset];
    if (!presetMembers) {
      throw usageError(
        `Unknown preset: ${preset}`,
        didYouMean(preset, presetNames),
        `Available presets: ${presetNames.join(", ")}`,
      );
    }

    for (const member of presetMembers) {
      selected.add(member);
    }
  }

  const sorted = [...selected].sort((left, right) => left.localeCompare(right));
  if (sorted.length === 0) {
    throw usageError("No components selected. Provide component names or --preset.");
  }

  return sorted;
}
