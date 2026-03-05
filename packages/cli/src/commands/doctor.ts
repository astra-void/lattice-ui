import { validationError } from "../core/errors";
import { getDependencyNames } from "../core/fs/patch";
import { readPackageJson } from "../core/project/readPackageJson";
import { parseProviderRequirement } from "../core/registry/schema";
import type { CliContext } from "../ctx";

type IssueLevel = "warn" | "error";

type Issue = {
  level: IssueLevel;
  message: string;
};

export async function runDoctorCommand(ctx: CliContext): Promise<void> {
  const manifest = await readPackageJson(ctx.projectRoot);
  const installedDependencies = getDependencyNames(manifest);

  const issues: Issue[] = [];

  if (ctx.detectedLockfiles.length === 0) {
    issues.push({
      level: "warn",
      message: "No lockfile found. Detected package manager defaults to npm.",
    });
  }

  if (ctx.detectedLockfiles.length > 1) {
    issues.push({
      level: "warn",
      message: `Multiple lockfiles detected: ${ctx.detectedLockfiles.join(", ")}. Using ${ctx.pmName}.`,
    });
  }

  if (typeof manifest.packageManager === "string" && manifest.packageManager.length > 0) {
    const normalized = manifest.packageManager.split("@")[0];
    if (normalized !== ctx.pmName) {
      issues.push({
        level: "warn",
        message: `packageManager field is ${manifest.packageManager} but detected ${ctx.pmName}.`,
      });
    }
  }

  const installedLattice = [...installedDependencies]
    .filter((name) => name.startsWith("@lattice-ui/"))
    .sort((left, right) => left.localeCompare(right));

  if (installedLattice.length === 0) {
    issues.push({
      level: "warn",
      message: "No @lattice-ui/* dependencies are installed.",
    });
  }

  const componentByNpm = new Map<string, string>();
  for (const [componentName, entry] of Object.entries(ctx.registry.packages)) {
    componentByNpm.set(entry.npm, componentName);
  }

  for (const npmPackage of installedLattice) {
    const componentName = componentByNpm.get(npmPackage);
    if (!componentName) {
      issues.push({
        level: "warn",
        message: `${npmPackage} is installed but not found in CLI registry.`,
      });
      continue;
    }

    const entry = ctx.registry.packages[componentName];

    for (const peer of entry.peers ?? []) {
      if (!installedDependencies.has(peer)) {
        issues.push({
          level: "warn",
          message: `${componentName} expects peer ${peer}, but it is not installed.`,
        });
      }
    }

    for (const rawProvider of entry.providers ?? []) {
      const provider = parseProviderRequirement(rawProvider);
      if (installedDependencies.has(provider.packageName)) {
        continue;
      }

      if (provider.optional) {
        issues.push({
          level: "warn",
          message: `${componentName} optional provider not found: ${provider.raw}`,
        });
      } else {
        issues.push({
          level: "error",
          message: `${componentName} required provider missing: ${provider.raw}`,
        });
      }
    }
  }

  let warnings = 0;
  let errors = 0;

  for (const issue of issues) {
    if (issue.level === "warn") {
      warnings += 1;
      ctx.logger.warn(issue.message);
    } else {
      errors += 1;
      ctx.logger.error(issue.message);
    }
  }

  if (errors > 0) {
    throw validationError(`doctor found ${errors} error(s) and ${warnings} warning(s).`);
  }

  if (warnings > 0) {
    ctx.logger.success(`doctor completed with ${warnings} warning(s).`);
  } else {
    ctx.logger.success("doctor found no issues.");
  }
}
