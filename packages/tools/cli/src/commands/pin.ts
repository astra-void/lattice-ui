import { describePackageManagerPin, planPackageManagerPin } from "../core/pm/devEngines";
import { readPackageJson } from "../core/project/readPackageJson";
import { writePackageJson } from "../core/project/writePackageJson";
import type { CliContext } from "../ctx";

/**
 * Repins package.json at the package manager this run uses.
 *
 * npm and pnpm both refuse to install when `devEngines.packageManager` names the other one, so a
 * project scaffolded with one manager cannot be touched by another until the pin moves.
 */
export async function applyPackageManagerPin(ctx: CliContext): Promise<void> {
  const conflicts = ctx.pins.filter((pin) => pin.name !== ctx.pmName);
  if (conflicts.length === 0) {
    return;
  }

  for (const pin of conflicts) {
    ctx.logger.warn(
      `Repinning ${describePackageManagerPin(pin)} to ${ctx.pmName}; ${pin.name} would refuse to install.`,
    );
  }

  if (ctx.options.dryRun) {
    return;
  }

  const manifest = await readPackageJson(ctx.projectRoot);
  const plan = planPackageManagerPin(manifest, ctx.pmName);
  if (plan.changed) {
    await writePackageJson(ctx.projectRoot, plan.nextManifest);
  }
}
