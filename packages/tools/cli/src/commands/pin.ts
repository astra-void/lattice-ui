import { describePackageManagerPin, planPackageManagerPin } from "../core/pm/devEngines";
import { readPackageJson } from "../core/project/readPackageJson";
import { writePackageJson } from "../core/project/writePackageJson";
import type { CliContext } from "../ctx";

function conflictingPins(ctx: CliContext) {
  return ctx.pins.filter((pin) => pin.name !== ctx.pmName);
}

/**
 * Warns that package.json will be repinned at the package manager this run uses. Called before the
 * confirmation prompt so the user sees it; nothing is written until `applyPackageManagerPin`.
 *
 * npm and pnpm both refuse to install when `devEngines.packageManager` names the other one, so a
 * project scaffolded with one manager cannot be touched by another until the pin moves.
 */
export function announcePackageManagerPin(ctx: CliContext): void {
  for (const pin of conflictingPins(ctx)) {
    ctx.logger.warn(
      `Repinning ${describePackageManagerPin(pin)} to ${ctx.pmName}; ${pin.name} would refuse to install.`,
    );
  }
}

/** Repins package.json at this run's package manager. Call only after the user confirmed. */
export async function applyPackageManagerPin(ctx: CliContext): Promise<void> {
  if (conflictingPins(ctx).length === 0 || ctx.options.dryRun) {
    return;
  }

  const manifest = await readPackageJson(ctx.projectRoot);
  const plan = planPackageManagerPin(manifest, ctx.pmName);
  if (plan.changed) {
    await writePackageJson(ctx.projectRoot, plan.nextManifest);
  }
}
