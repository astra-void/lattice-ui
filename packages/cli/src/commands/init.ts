import { promises as fs } from "node:fs";
import * as path from "node:path";
import { copyTemplateSafe } from "../core/fs/copy";
import { type PackageJson, readPackageJson } from "../core/project/readPackageJson";
import { writePackageJson } from "../core/project/writePackageJson";
import type { CliContext } from "../ctx";

function inferPackageName(projectRoot: string): string {
  const baseName = path.basename(projectRoot);
  const normalized = baseName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .replace(/-{2,}/g, "-");

  return normalized.length > 0 ? normalized : "lattice-app";
}

export async function runInitCommand(ctx: CliContext): Promise<void> {
  const templateDir = path.resolve(__dirname, "../../templates/init");

  if (!ctx.options.dryRun) {
    const confirmed = await ctx.logger.confirm(`Initialize project files in ${ctx.projectRoot}?`);
    if (!confirmed) {
      ctx.logger.warn("Initialization cancelled.");
      return;
    }
  }

  const spinner = ctx.logger.spinner("Scaffolding init template...");
  const report = await copyTemplateSafe(templateDir, ctx.projectRoot, {
    dryRun: ctx.options.dryRun,
    logger: ctx.logger,
    replacements: {
      __PROJECT_NAME__: inferPackageName(ctx.projectRoot),
    },
  });
  spinner.succeed("Scaffold step completed.");

  const packageJsonPath = path.join(ctx.projectRoot, "package.json");
  let manifest: PackageJson;

  try {
    await fs.access(packageJsonPath);
    manifest = await readPackageJson(ctx.projectRoot);
  } catch {
    manifest = {};
  }

  let changed = false;
  if (!manifest.name || manifest.name.trim().length === 0) {
    manifest.name = inferPackageName(ctx.projectRoot);
    changed = true;
  }

  if (changed) {
    if (ctx.options.dryRun) {
      ctx.logger.info(`[dry-run] Would update package.json name to "${manifest.name}".`);
    } else {
      await writePackageJson(ctx.projectRoot, manifest);
    }
  }

  ctx.logger.success(
    `Template result: created=${report.created.length}, merged=${report.merged.length}, skipped=${report.skipped.length}`,
  );

  if (ctx.options.dryRun) {
    ctx.logger.info(`[dry-run] Would run ${ctx.pmName} install.`);
    return;
  }

  const installSpinner = ctx.logger.spinner(`Installing dependencies with ${ctx.pmName}...`);
  await ctx.pm.install(ctx.projectRoot);
  installSpinner.succeed("Dependencies installed.");
}
