import { usageError } from "../core/errors";
import { getDependencyNames, toPackageName } from "../core/fs/patch";
import { resolveLocalLatticeCommand, summarizeItems } from "../core/output";
import { readPackageJson } from "../core/project/readPackageJson";
import { promptMultiSelect } from "../core/prompt";
import { parseProviderRequirement } from "../core/registry/schema";
import type { CliContext } from "../ctx";
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
  const localLattice = resolveLocalLatticeCommand(ctx.pmName);

  ctx.logger.section("Selecting");
  ctx.logger.kv("Project", ctx.projectRoot);

  ctx.logger.section("Planning");
  const componentSummary = summarizeItems(components);
  ctx.logger.kv("Components", String(componentSummary.total));
  if (componentSummary.total > 0) {
    ctx.logger.list(componentSummary.visible);
    if (componentSummary.hidden > 0) {
      ctx.logger.step(`...and ${componentSummary.hidden} more`);
    }
  }
  const plannedSummary = summarizeItems(plannedSpecs);
  ctx.logger.kv("Packages to install", String(plannedSummary.total));
  if (plannedSummary.total > 0) {
    ctx.logger.list(plannedSummary.visible);
    if (plannedSummary.hidden > 0) {
      ctx.logger.step(`...and ${plannedSummary.hidden} more`);
    }
  }

  if (ctx.options.dryRun) {
    ctx.logger.section("Dry Run");
    if (plannedSpecs.length > 0) {
      ctx.logger.step(`[dry-run] ${ctx.pmName} add ${plannedSpecs.join(" ")}`);
    } else {
      ctx.logger.step("[dry-run] No install actions required.");
    }
    ctx.logger.step("No files were changed.");
  } else {
    ctx.logger.section("Applying");
    if (plannedSpecs.length > 0) {
      ctx.logger.step(`${ctx.pmName} add ${plannedSpecs.join(" ")}`);
      const confirmed = await ctx.logger.confirm(`Install ${plannedSpecs.length} package(s) in ${ctx.projectRoot}?`);
      if (!confirmed) {
        ctx.logger.section("Result");
        ctx.logger.warn("Add command cancelled.");
        ctx.logger.section("Next Steps");
        ctx.logger.step(`${localLattice} doctor`);
        return;
      }

      const spinner = ctx.logger.spinner(`Installing ${plannedSpecs.length} package(s)...`);
      await ctx.pm.add(false, plannedSpecs, ctx.projectRoot);
      spinner.succeed("Dependencies installed.");
    } else {
      ctx.logger.step("No installation required.");
    }
  }

  ctx.logger.section("Result");
  if (plannedSpecs.length === 0) {
    ctx.logger.success("No new packages were needed.");
  } else {
    ctx.logger.success(`Added components: ${components.join(", ")}`);
  }
  ctx.logger.kv("Installed packages", String(plannedSpecs.length));

  if (optionalProviders.size > 0) {
    const optionalSummary = summarizeItems([...optionalProviders].sort((left, right) => left.localeCompare(right)));
    ctx.logger.warn(`Optional providers available: ${optionalSummary.total}`);
    ctx.logger.list(optionalSummary.visible);
    if (optionalSummary.hidden > 0) {
      ctx.logger.step(`...and ${optionalSummary.hidden} more`);
    }
  }

  if (notes.length > 0) {
    const noteSummary = summarizeItems(notes);
    ctx.logger.info(`Notes: ${noteSummary.total}`);
    ctx.logger.list(noteSummary.visible);
    if (noteSummary.hidden > 0) {
      ctx.logger.step(`...and ${noteSummary.hidden} more`);
    }
  }

  ctx.logger.section("Next Steps");
  ctx.logger.step(`${localLattice} doctor`);
  if (optionalProviders.size > 0) {
    ctx.logger.step(`${localLattice} add <component>`);
  }
  if (notes.length > 0) {
    ctx.logger.step("Review notes above before integrating components.");
  }
}
