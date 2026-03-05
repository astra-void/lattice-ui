import { usageError } from "../core/errors";
import type { CliContext } from "../ctx";

export interface SelectionInput {
  names: string[];
  presets: string[];
}

export function resolveComponentSelection(ctx: CliContext, input: SelectionInput): string[] {
  const selected = new Set<string>();

  for (const name of input.names) {
    if (!ctx.registry.packages[name]) {
      throw usageError(`Unknown component: ${name}`);
    }
    selected.add(name);
  }

  for (const preset of input.presets) {
    const presetMembers = ctx.registry.presets[preset];
    if (!presetMembers) {
      throw usageError(`Unknown preset: ${preset}`);
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
