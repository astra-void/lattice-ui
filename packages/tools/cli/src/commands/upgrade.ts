import { usageError } from "../core/errors";
import {
  describePackageManager,
  ITEM_LIMIT,
  linkPackage,
  linkPath,
  plural,
  resolveLocalLatticeCommand,
} from "../core/output";
import { LEGACY_PACKAGE_RENAMES } from "../core/project/legacyPackages";
import { readPackageJson } from "../core/project/readPackageJson";
import { promptMultiSelect } from "../core/prompt";
import type { CliContext } from "../ctx";
import { applyPackageManagerPin } from "./pin";
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

  const installedNames = [...Object.keys(dependencies), ...Object.keys(devDependencies)].filter((name) =>
    name.startsWith("@lattice-ui/"),
  );
  // Renamed packages have no newer release under the old name; `init` migrates them.
  const legacyInstalled = normalizeList(installedNames.filter((name) => LEGACY_PACKAGE_RENAMES[name] !== undefined));
  const installedLattice = normalizeList(installedNames.filter((name) => LEGACY_PACKAGE_RENAMES[name] === undefined));

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
  const dryRun = ctx.options.dryRun;

  ctx.logger.header("lattice upgrade", dryRun ? "dry run" : undefined);
  ctx.logger.fields([
    ["Project", linkPath(ctx.projectRoot, ctx.cwd)],
    ["Manager", describePackageManager(ctx.pmName, ctx.pmResolutionSource)],
  ]);

  for (const name of legacyInstalled) {
    ctx.logger.warn(
      `${name} was renamed to ${LEGACY_PACKAGE_RENAMES[name]}; skipping. Run \`${localLattice} init\` to migrate it.`,
    );
  }

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

  const planned = dependencySpecs.length + devDependencySpecs.length;

  if (targets.length === 0) {
    ctx.logger.outcome("No installed @lattice-ui/* package matched the selection.", "warn");
    ctx.logger.next([`${localLattice} doctor`]);
    return;
  }

  if (missingRequested.length > 0) {
    ctx.logger.group("Not installed, skipped", missingRequested, { tone: "warn", limit: ITEM_LIMIT });
  }

  if (dependencySpecs.length > 0) {
    ctx.logger.group(
      `${dryRun ? "Would upgrade" : "Upgrade"} ${dependencySpecs.length} ${plural(dependencySpecs.length, "dependency", "dependencies")}`,
      dependencySpecs.map(linkPackage),
      { limit: ITEM_LIMIT },
    );
  }

  if (devDependencySpecs.length > 0) {
    ctx.logger.group(
      `${dryRun ? "Would upgrade" : "Upgrade"} ${devDependencySpecs.length} dev ${plural(devDependencySpecs.length, "dependency", "dependencies")}`,
      devDependencySpecs.map(linkPackage),
      { limit: ITEM_LIMIT },
    );
  }

  if (planned === 0) {
    ctx.logger.outcome("Everything is already up to date.");
    ctx.logger.next([`${localLattice} doctor`]);
    return;
  }

  await applyPackageManagerPin(ctx);
  if (dependencySpecs.length > 0) {
    ctx.logger.command(`${ctx.pmName} add ${dependencySpecs.join(" ")}`);
  }
  if (devDependencySpecs.length > 0) {
    ctx.logger.command(`${ctx.pmName} add -D ${devDependencySpecs.join(" ")}`);
  }

  if (dryRun) {
    ctx.logger.outcome("Nothing changed. Re-run without --dry-run to apply.", "plain");
    ctx.logger.next([`${localLattice} doctor`]);
    return;
  }

  const confirmed = await ctx.logger.confirm(`Upgrade ${planned} ${plural(planned, "package")}?`);
  if (!confirmed) {
    ctx.logger.outcome("Cancelled. Nothing changed.", "warn");
    return;
  }

  const spinner = ctx.logger.spinner(`Upgrading ${planned} ${plural(planned, "package")}…`);
  try {
    if (dependencySpecs.length > 0) {
      await ctx.pm.add(false, dependencySpecs, ctx.projectRoot);
    }
    if (devDependencySpecs.length > 0) {
      await ctx.pm.add(true, devDependencySpecs, ctx.projectRoot);
    }
  } catch (error) {
    spinner.fail("Upgrade failed.");
    throw error;
  }
  spinner.succeed(`Upgraded ${planned} ${plural(planned, "package")}.`);

  ctx.logger.next([`${localLattice} doctor`]);
}
