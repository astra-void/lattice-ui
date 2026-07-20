import { usageError } from "../core/errors";
import { getDependencyNames, toPackageName } from "../core/fs/patch";
import type { GroupItem } from "../core/logger";
import {
  describePackageManager,
  ITEM_LIMIT,
  linkPackage,
  linkPath,
  plural,
  resolveLocalLatticeCommand,
} from "../core/output";
import { readPackageJson } from "../core/project/readPackageJson";
import { promptMultiSelect } from "../core/prompt";
import { parseProviderRequirement } from "../core/registry/schema";
import type { CliContext } from "../ctx";
import { applyPackageManagerPin } from "./pin";
import { resolveComponentSelection, type SelectionInput } from "./selection";

async function resolveSelectionInput(ctx: CliContext, input: SelectionInput): Promise<SelectionInput> {
  if (input.names.length > 0 || input.presets.length > 0) {
    return input;
  }

  if (ctx.options.yes) {
    throw usageError("No components selected. Provide component names or --preset when using --yes.");
  }

  const runtime = {
    yes: ctx.options.yes,
  };

  const presetOptions = Object.keys(ctx.registry.presets)
    .sort((left, right) => left.localeCompare(right))
    .map((presetName) => ({
      label: `${presetName} (${ctx.registry.presets[presetName].join(", ")})`,
      value: presetName,
    }));

  const componentOptions = Object.keys(ctx.registry.packages)
    .sort((left, right) => left.localeCompare(right))
    .map((componentName) => ({
      label: componentName,
      value: componentName,
    }));

  const selectedPresets = await promptMultiSelect(runtime, "Select presets (optional)", presetOptions, {
    allowEmpty: true,
  });
  const selectedComponents = await promptMultiSelect(runtime, "Select components (optional)", componentOptions, {
    allowEmpty: true,
  });

  return {
    names: selectedComponents,
    presets: selectedPresets,
  };
}

export async function runAddCommand(ctx: CliContext, input: SelectionInput): Promise<void> {
  const resolvedInput = await resolveSelectionInput(ctx, input);
  const components = resolveComponentSelection(ctx, resolvedInput);
  const specs = new Set<string>();
  const optionalProviders = new Set<string>();
  const notes: GroupItem[] = [];

  for (const component of components) {
    const entry = ctx.registry.packages[component];
    specs.add(entry.npm);

    for (const peer of entry.peers ?? []) {
      specs.add(peer);
    }

    for (const rawProvider of entry.providers ?? []) {
      const provider = parseProviderRequirement(rawProvider);
      if (provider.optional) {
        // The `?` marker is what makes it optional in the registry; the block heading already
        // says so, so it would only read as uncertainty here.
        optionalProviders.add(
          provider.providerName ? `${provider.packageName}:${provider.providerName}` : provider.packageName,
        );
      } else {
        specs.add(provider.packageName);
      }
    }

    for (const note of entry.notes ?? []) {
      notes.push([component, note]);
    }
  }

  const packageJson = await readPackageJson(ctx.projectRoot);
  const installed = getDependencyNames(packageJson);
  const plannedSpecs = [...specs]
    .filter((spec) => !installed.has(toPackageName(spec)))
    .sort((left, right) => left.localeCompare(right));
  const localLattice = resolveLocalLatticeCommand(ctx.pmName);
  const dryRun = ctx.options.dryRun;

  ctx.logger.header("lattice add", dryRun ? "dry run" : undefined);
  ctx.logger.fields([
    ["Project", linkPath(ctx.projectRoot, ctx.cwd)],
    ["Manager", describePackageManager(ctx.pmName, ctx.pmResolutionSource)],
    ["Components", components.join(", ")],
  ]);

  if (plannedSpecs.length > 0) {
    ctx.logger.group(
      `${dryRun ? "Would install" : "Install"} ${plannedSpecs.length} ${plural(plannedSpecs.length, "package")}`,
      plannedSpecs.map(linkPackage),
      { limit: ITEM_LIMIT },
    );
  }

  if (optionalProviders.size > 0) {
    ctx.logger.group(
      "Optional providers",
      [...optionalProviders].sort((left, right) => left.localeCompare(right)),
      {
        tone: "warn",
        limit: ITEM_LIMIT,
      },
    );
  }

  if (notes.length > 0) {
    ctx.logger.group("Notes", notes, { limit: ITEM_LIMIT });
  }

  if (plannedSpecs.length > 0) {
    await applyPackageManagerPin(ctx);
    ctx.logger.command(`${ctx.pmName} add ${plannedSpecs.join(" ")}`);
  }

  if (plannedSpecs.length === 0) {
    ctx.logger.outcome("Every package is already installed.");
    ctx.logger.next([`${localLattice} doctor`]);
    return;
  }

  if (dryRun) {
    ctx.logger.outcome("Nothing changed. Re-run without --dry-run to apply.", "plain");
    ctx.logger.next([`${localLattice} doctor`]);
    return;
  }

  const confirmed = await ctx.logger.confirm(
    `Install ${plannedSpecs.length} ${plural(plannedSpecs.length, "package")}?`,
  );
  if (!confirmed) {
    ctx.logger.outcome("Cancelled. Nothing changed.", "warn");
    return;
  }

  const spinner = ctx.logger.spinner(`Installing ${plannedSpecs.length} ${plural(plannedSpecs.length, "package")}…`);
  try {
    await ctx.pm.add(false, plannedSpecs, ctx.projectRoot);
  } catch (error) {
    spinner.fail("Install failed.");
    throw error;
  }
  spinner.stop(`Installed ${plannedSpecs.length} ${plural(plannedSpecs.length, "package")}.`);

  ctx.logger.outcome(`Added ${components.length} ${plural(components.length, "component")}: ${components.join(", ")}`);
  ctx.logger.next([
    `${localLattice} doctor`,
    ...(notes.length > 0 ? ["Review the notes above before integrating."] : []),
  ]);
}
