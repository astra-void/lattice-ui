import { usageError } from "../core/errors";
import { readPackageJson } from "../core/project/readPackageJson";
import { promptMultiSelect } from "../core/prompt";
import type { CliContext } from "../ctx";
import type { SelectionInput } from "./add";
import { resolveComponentSelection } from "./add";

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

    const missing = requestedRegistryPackages.filter((pkg) => !installedSet.has(pkg));
    if (missing.length > 0) {
      ctx.logger.warn(`Requested package(s) not currently installed: ${normalizeList(missing).join(", ")}`);
    }
  }

  if (targets.length === 0) {
    ctx.logger.warn("No installed @lattice-ui/* package matched upgrade selection.");
    return;
  }

  const dependencySpecs = normalizeList(
    targets.filter((pkg) => dependencies[pkg] !== undefined).map((pkg) => `${pkg}@latest`),
  );
  const devDependencySpecs = normalizeList(
    targets
      .filter((pkg) => dependencies[pkg] === undefined && devDependencies[pkg] !== undefined)
      .map((pkg) => `${pkg}@latest`),
  );

  if (dependencySpecs.length === 0 && devDependencySpecs.length === 0) {
    throw usageError("No upgradable dependency targets were found.");
  }

  if (!ctx.options.dryRun) {
    const confirmed = await ctx.logger.confirm(
      `Upgrade ${targets.length} package(s) in ${ctx.projectRoot} with ${ctx.pmName}?`,
    );
    if (!confirmed) {
      ctx.logger.warn("Upgrade cancelled.");
      return;
    }
  }

  if (ctx.options.dryRun) {
    if (dependencySpecs.length > 0) {
      ctx.logger.info(`[dry-run] ${ctx.pmName} add ${dependencySpecs.join(" ")}`);
    }
    if (devDependencySpecs.length > 0) {
      ctx.logger.info(`[dry-run] ${ctx.pmName} add -D ${devDependencySpecs.join(" ")}`);
    }
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
