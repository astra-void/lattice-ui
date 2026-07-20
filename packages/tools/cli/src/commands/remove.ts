import { usageError } from "../core/errors";
import { getDependencyNames } from "../core/fs/patch";
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
import type { CliContext } from "../ctx";
import { applyPackageManagerPin } from "./pin";
import { resolveComponentSelection, type SelectionInput } from "./selection";

function normalizeList(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

export async function runRemoveCommand(ctx: CliContext, input: SelectionInput): Promise<void> {
  const localLattice = resolveLocalLatticeCommand(ctx.pmName);
  const dryRun = ctx.options.dryRun;

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
      ctx.logger.header("lattice remove", dryRun ? "dry run" : undefined);
      ctx.logger.outcome("No installed registry components to remove.", "warn");
      ctx.logger.next([`${localLattice} doctor`]);
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

  const specs = normalizeList(components.map((component) => ctx.registry.packages[component].npm));
  const plannedSpecs = specs.filter((spec) => installedDependencies.has(spec));
  const missingComponents = normalizeList(
    components.filter((component) => !installedDependencies.has(ctx.registry.packages[component].npm)),
  );
  const removedComponents = normalizeList(
    components.filter((component) => installedDependencies.has(ctx.registry.packages[component].npm)),
  );

  ctx.logger.header("lattice remove", dryRun ? "dry run" : undefined);
  ctx.logger.fields([
    ["Project", linkPath(ctx.projectRoot, ctx.cwd)],
    ["Manager", describePackageManager(ctx.pmName, ctx.pmResolutionSource)],
    ["Components", components.join(", ")],
  ]);

  if (plannedSpecs.length > 0) {
    ctx.logger.group(
      `${dryRun ? "Would remove" : "Remove"} ${plannedSpecs.length} ${plural(plannedSpecs.length, "package")}`,
      plannedSpecs.map(linkPackage),
      { limit: ITEM_LIMIT },
    );
  }

  if (missingComponents.length > 0) {
    ctx.logger.group("Not installed, skipped", missingComponents, { tone: "warn", limit: ITEM_LIMIT });
  }

  if (plannedSpecs.length === 0) {
    ctx.logger.outcome("No installed package matched the selection.", "warn");
    ctx.logger.next([`${localLattice} doctor`]);
    return;
  }

  await applyPackageManagerPin(ctx);
  ctx.logger.command(`${ctx.pmName} remove ${plannedSpecs.join(" ")}`);

  if (dryRun) {
    ctx.logger.outcome("Nothing changed. Re-run without --dry-run to apply.", "plain");
    ctx.logger.next([`${localLattice} doctor`]);
    return;
  }

  const confirmed = await ctx.logger.confirm(
    `Remove ${plannedSpecs.length} ${plural(plannedSpecs.length, "package")}?`,
  );
  if (!confirmed) {
    ctx.logger.outcome("Cancelled. Nothing changed.", "warn");
    return;
  }

  const spinner = ctx.logger.spinner(`Removing ${plannedSpecs.length} ${plural(plannedSpecs.length, "package")}…`);
  try {
    await ctx.pm.remove(plannedSpecs, ctx.projectRoot);
  } catch (error) {
    spinner.fail("Remove failed.");
    throw error;
  }
  spinner.stop(`Removed ${plannedSpecs.length} ${plural(plannedSpecs.length, "package")}.`);

  ctx.logger.outcome(
    `Removed ${removedComponents.length} ${plural(removedComponents.length, "component")}: ${removedComponents.join(", ")}`,
  );
  ctx.logger.next([`${localLattice} doctor`]);
}
