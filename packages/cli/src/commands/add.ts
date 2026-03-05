import { usageError } from "../core/errors";
import { getDependencyNames, toPackageName } from "../core/fs/patch";
import { readPackageJson } from "../core/project/readPackageJson";
import { parseProviderRequirement } from "../core/registry/schema";
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

export async function runAddCommand(ctx: CliContext, input: SelectionInput): Promise<void> {
  const components = resolveComponentSelection(ctx, input);
  const specs = new Set<string>();
  const optionalProviders = new Set<string>();
  const notes: string[] = [];

  for (const component of components) {
    const entry = ctx.registry.packages[component];
    specs.add(entry.npm);

    for (const peer of entry.peers ?? []) {
      specs.add(peer);
    }

    for (const rawProvider of entry.providers ?? []) {
      const provider = parseProviderRequirement(rawProvider);
      if (provider.optional) {
        optionalProviders.add(provider.raw);
      } else {
        specs.add(provider.packageName);
      }
    }

    for (const note of entry.notes ?? []) {
      notes.push(`${component}: ${note}`);
    }
  }

  const packageJson = await readPackageJson(ctx.projectRoot);
  const installed = getDependencyNames(packageJson);
  const plannedSpecs = [...specs]
    .filter((spec) => !installed.has(toPackageName(spec)))
    .sort((left, right) => left.localeCompare(right));

  if (plannedSpecs.length === 0) {
    ctx.logger.success("All requested packages are already present.");
  } else {
    if (!ctx.options.dryRun) {
      const confirmed = await ctx.logger.confirm(
        `Install ${plannedSpecs.length} package(s) in ${ctx.projectRoot} with ${ctx.pmName}?`,
      );
      if (!confirmed) {
        ctx.logger.warn("Add command cancelled.");
        return;
      }
    }

    if (ctx.options.dryRun) {
      ctx.logger.info(`[dry-run] ${ctx.pmName} add ${plannedSpecs.join(" ")}`);
    } else {
      const spinner = ctx.logger.spinner(`Installing ${plannedSpecs.length} package(s)...`);
      await ctx.pm.add(false, plannedSpecs, ctx.projectRoot);
      spinner.succeed("Dependencies installed.");
    }

    ctx.logger.success(`Added components: ${components.join(", ")}`);
  }

  if (optionalProviders.size > 0) {
    ctx.logger.warn(`Optional providers: ${[...optionalProviders].sort().join(", ")}`);
  }

  if (notes.length > 0) {
    for (const note of notes) {
      ctx.logger.info(`note: ${note}`);
    }
  }
}
