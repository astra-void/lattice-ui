import { usageError } from "../core/errors";
import { getDependencyNames } from "../core/fs/patch";
import { resolveLocalLatticeCommand, summarizeItems } from "../core/output";
import { readPackageJson } from "../core/project/readPackageJson";
import { promptMultiSelect } from "../core/prompt";
import type { CliContext } from "../ctx";
import { resolveComponentSelection, type SelectionInput } from "./selection";

function normalizeList(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

export async function runRemoveCommand(ctx: CliContext, input: SelectionInput): Promise<void> {
  const localLattice = resolveLocalLatticeCommand(ctx.pmName);

  ctx.logger.section("Selecting");
  ctx.logger.kv("Project", ctx.projectRoot);

  const packageJson = await readPackageJson(ctx.projectRoot);
  const installedDependencies = getDependencyNames(packageJson);

  let components: string[];
  if (input.names.length > 0 || input.presets.length > 0) {
    components = resolveComponentSelection(ctx, input);
  } else {
    if (ctx.options.yes) {
      throw usageError("No components selected. Provide component names or --preset when using --yes.");
    }

    const installedComponents = Object.keys(ctx.registry.packages)
      .filter((componentName) => installedDependencies.has(ctx.registry.packages[componentName].npm))
      .sort((left, right) => left.localeCompare(right));

    if (installedComponents.length === 0) {
      ctx.logger.section("Result");
      ctx.logger.warn("No installed registry components found to remove.");
      ctx.logger.section("Next Steps");
      ctx.logger.step(`${localLattice} doctor`);
      return;
    }

    components = await promptMultiSelect(
      { yes: ctx.options.yes },
      "Select installed components to remove",
      installedComponents.map((componentName) => ({
        label: componentName,
        value: componentName,
      })),
      {
        allowEmpty: false,
      },
    );
  }

  const selectedSummary = summarizeItems(components);
  const specs = normalizeList(components.map((component) => ctx.registry.packages[component].npm));
  const plannedSpecs = specs.filter((spec) => installedDependencies.has(spec));
  const missingComponents = normalizeList(
    components.filter((component) => !installedDependencies.has(ctx.registry.packages[component].npm)),
  );
  const removedComponents = normalizeList(
    components.filter((component) => installedDependencies.has(ctx.registry.packages[component].npm)),
  );

  ctx.logger.section("Planning");
  ctx.logger.kv("Selected components", String(selectedSummary.total));
  if (selectedSummary.total > 0) {
    ctx.logger.list(selectedSummary.visible);
    if (selectedSummary.hidden > 0) {
      ctx.logger.step(`...and ${selectedSummary.hidden} more`);
    }
  }
  const plannedSummary = summarizeItems(plannedSpecs);
  ctx.logger.kv("Packages to remove", String(plannedSummary.total));
  if (plannedSummary.total > 0) {
    ctx.logger.list(plannedSummary.visible);
    if (plannedSummary.hidden > 0) {
      ctx.logger.step(`...and ${plannedSummary.hidden} more`);
    }
  }
  if (missingComponents.length > 0) {
    const missingSummary = summarizeItems(missingComponents);
    ctx.logger.kv("Missing selected", String(missingSummary.total));
    ctx.logger.list(missingSummary.visible);
    if (missingSummary.hidden > 0) {
      ctx.logger.step(`...and ${missingSummary.hidden} more`);
    }
  }

  if (ctx.options.dryRun) {
    ctx.logger.section("Dry Run");
    if (plannedSpecs.length > 0) {
      ctx.logger.step(`[dry-run] ${ctx.pmName} remove ${plannedSpecs.join(" ")}`);
    } else {
      ctx.logger.step("[dry-run] No remove actions required.");
    }
    ctx.logger.step("No files were changed.");
  } else {
    ctx.logger.section("Applying");
    if (plannedSpecs.length > 0) {
      ctx.logger.step(`${ctx.pmName} remove ${plannedSpecs.join(" ")}`);
      const confirmed = await ctx.logger.confirm(`Remove ${plannedSpecs.length} package(s) in ${ctx.projectRoot}?`);
      if (!confirmed) {
        ctx.logger.section("Result");
        ctx.logger.warn("Remove command cancelled.");
        ctx.logger.section("Next Steps");
        ctx.logger.step(`${localLattice} doctor`);
        return;
      }

      const spinner = ctx.logger.spinner(`Removing ${plannedSpecs.length} package(s)...`);
      await ctx.pm.remove(plannedSpecs, ctx.projectRoot);
      spinner.succeed("Dependencies removed.");
    } else {
      ctx.logger.step("No removal required.");
    }
  }

  ctx.logger.section("Result");
  if (plannedSpecs.length === 0) {
    ctx.logger.warn("No installed package matched remove selection.");
  } else {
    ctx.logger.success(`Removed components: ${removedComponents.join(", ")}`);
  }
  ctx.logger.kv("Removed packages", String(plannedSpecs.length));

  ctx.logger.section("Next Steps");
  ctx.logger.step(`${localLattice} doctor`);
}
