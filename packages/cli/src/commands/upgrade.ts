import { usageError } from "../core/errors";
import { resolveLocalLatticeCommand, summarizeItems } from "../core/output";
import { readPackageJson } from "../core/project/readPackageJson";
import { promptMultiSelect } from "../core/prompt";
import type { CliContext } from "../ctx";
import { resolveComponentSelection, type SelectionInput } from "./selection";

function getSelectedRegistryPackages(ctx: CliContext, input: SelectionInput): string[] {
  const components = resolveComponentSelection(ctx, input);
  return components.map((component) => ctx.registry.packages[component].npm);
}

function normalizeList(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

export async function runUpgradeCommand(ctx: CliContext, input: SelectionInput): Promise<void> {
  const packageJson = await readPackageJson(ctx.projectRoot);
  const dependencies = packageJson.dependencies ?? {};
  const devDependencies = packageJson.devDependencies ?? {};

  const installedLattice = normalizeList(
    [...Object.keys(dependencies), ...Object.keys(devDependencies)].filter((name) => name.startsWith("@lattice-ui/")),
  );

  let targets: string[];
  let missingRequested: string[] = [];
  if (input.names.length === 0 && input.presets.length === 0) {
    if (ctx.options.yes) {
      targets = installedLattice;
    } else {
      targets = await promptMultiSelect(
        { yes: ctx.options.yes },
        "Select installed @lattice-ui/* packages to upgrade",
        installedLattice.map((name) => ({ label: name, value: name })),
        {
          allowEmpty: false,
          defaultIndices: installedLattice.map((_, index) => index),
        },
      );
    }
  } else {
    const requestedRegistryPackages = getSelectedRegistryPackages(ctx, input);
    const installedSet = new Set(installedLattice);
    targets = normalizeList(requestedRegistryPackages.filter((pkg) => installedSet.has(pkg)));
    missingRequested = normalizeList(requestedRegistryPackages.filter((pkg) => !installedSet.has(pkg)));
  }

  const localLattice = resolveLocalLatticeCommand(ctx.pmName);

  ctx.logger.section("Selecting");
  ctx.logger.kv("Project", ctx.projectRoot);

  let dependencySpecs: string[] = [];
  let devDependencySpecs: string[] = [];
  if (targets.length > 0) {
    dependencySpecs = normalizeList(
      targets.filter((pkg) => dependencies[pkg] !== undefined).map((pkg) => `${pkg}@latest`),
    );
    devDependencySpecs = normalizeList(
      targets
        .filter((pkg) => dependencies[pkg] === undefined && devDependencies[pkg] !== undefined)
        .map((pkg) => `${pkg}@latest`),
    );
    if (dependencySpecs.length === 0 && devDependencySpecs.length === 0) {
      throw usageError("No upgradable dependency targets were found.");
    }
  }

  ctx.logger.section("Planning");
  const selectedSummary = summarizeItems(targets);
  ctx.logger.kv("Selected", String(selectedSummary.total));
  if (selectedSummary.total > 0) {
    ctx.logger.list(selectedSummary.visible);
    if (selectedSummary.hidden > 0) {
      ctx.logger.step(`...and ${selectedSummary.hidden} more`);
    }
  }
  if (missingRequested.length > 0) {
    const missingSummary = summarizeItems(missingRequested);
    ctx.logger.kv("Missing requested", String(missingSummary.total));
    ctx.logger.list(missingSummary.visible);
    if (missingSummary.hidden > 0) {
      ctx.logger.step(`...and ${missingSummary.hidden} more`);
    }
  }
  const dependencySummary = summarizeItems(dependencySpecs);
  const devDependencySummary = summarizeItems(devDependencySpecs);
  ctx.logger.kv("Dependency upgrades", String(dependencySummary.total));
  if (dependencySummary.total > 0) {
    ctx.logger.list(dependencySummary.visible);
    if (dependencySummary.hidden > 0) {
      ctx.logger.step(`...and ${dependencySummary.hidden} more`);
    }
  }
  ctx.logger.kv("Dev dependency upgrades", String(devDependencySummary.total));
  if (devDependencySummary.total > 0) {
    ctx.logger.list(devDependencySummary.visible);
    if (devDependencySummary.hidden > 0) {
      ctx.logger.step(`...and ${devDependencySummary.hidden} more`);
    }
  }

  if (ctx.options.dryRun) {
    ctx.logger.section("Dry Run");
    if (dependencySpecs.length === 0 && devDependencySpecs.length === 0) {
      ctx.logger.step("[dry-run] No install actions required.");
    } else {
      if (dependencySpecs.length > 0) {
        ctx.logger.step(`[dry-run] ${ctx.pmName} add ${dependencySpecs.join(" ")}`);
      }
      if (devDependencySpecs.length > 0) {
        ctx.logger.step(`[dry-run] ${ctx.pmName} add -D ${devDependencySpecs.join(" ")}`);
      }
    }
    ctx.logger.step("No files were changed.");
  } else {
    ctx.logger.section("Applying");
    if (dependencySpecs.length === 0 && devDependencySpecs.length === 0) {
      ctx.logger.step("No installation required.");
    } else {
      if (dependencySpecs.length > 0) {
        ctx.logger.step(`${ctx.pmName} add ${dependencySpecs.join(" ")}`);
      }
      if (devDependencySpecs.length > 0) {
        ctx.logger.step(`${ctx.pmName} add -D ${devDependencySpecs.join(" ")}`);
      }

      const confirmed = await ctx.logger.confirm(`Upgrade ${targets.length} package(s) in ${ctx.projectRoot}?`);
      if (!confirmed) {
        ctx.logger.section("Result");
        ctx.logger.warn("Upgrade cancelled.");
        ctx.logger.section("Next Steps");
        ctx.logger.step(`${localLattice} doctor`);
        return;
      }

      const spinner = ctx.logger.spinner("Upgrading packages...");
      if (dependencySpecs.length > 0) {
        await ctx.pm.add(false, dependencySpecs, ctx.projectRoot);
      }
      if (devDependencySpecs.length > 0) {
        await ctx.pm.add(true, devDependencySpecs, ctx.projectRoot);
      }
      spinner.succeed(`Upgraded ${targets.length} package(s).`);
    }
  }

  if (targets.length === 0) {
    ctx.logger.section("Result");
    ctx.logger.warn("No installed @lattice-ui/* package matched upgrade selection.");
    ctx.logger.section("Next Steps");
    ctx.logger.step(`${localLattice} doctor`);
    return;
  }

  ctx.logger.section("Result");
  if (dependencySpecs.length === 0 && devDependencySpecs.length === 0) {
    ctx.logger.success("No package upgrades were needed.");
  } else {
    ctx.logger.success("Upgrade completed.");
  }
  ctx.logger.kv("Dependency upgrades", String(dependencySpecs.length));
  ctx.logger.kv("Dev dependency upgrades", String(devDependencySpecs.length));

  ctx.logger.section("Next Steps");
  ctx.logger.step(`${localLattice} doctor`);
}
