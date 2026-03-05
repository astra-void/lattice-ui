import { validationError } from "../core/errors";
import { getDependencyNames } from "../core/fs/patch";
import { readPackageJson } from "../core/project/readPackageJson";
import { parseProviderRequirement } from "../core/registry/schema";
import type { CliContext } from "../ctx";

type IssueLevel = "warn" | "error";

type IssueCode =
  | "missing-lockfile"
  | "multiple-lockfiles"
  | "package-manager-mismatch"
  | "missing-lattice-packages"
  | "unknown-lattice-package"
  | "missing-peer"
  | "missing-optional-provider"
  | "missing-required-provider";

type Issue = {
  code: IssueCode;
  level: IssueLevel;
  message: string;
};

function collectRecommendations(issues: Issue[]): string[] {
  const recommendationSet = new Set<string>();

  for (const issue of issues) {
    switch (issue.code) {
      case "missing-lockfile":
        recommendationSet.add("Run your package manager install command to generate a lockfile.");
        break;
      case "multiple-lockfiles":
        recommendationSet.add("Keep only one lockfile in the project root to avoid package manager drift.");
        break;
      case "package-manager-mismatch":
        recommendationSet.add("Align packageManager in package.json with the lockfile manager used by the project.");
        break;
      case "missing-lattice-packages":
        recommendationSet.add(
          "Install Lattice packages with lattice add <component> or lattice add --preset <preset>.",
        );
        break;
      case "unknown-lattice-package":
        recommendationSet.add("Run lattice upgrade to align installed package names with the current registry.");
        break;
      case "missing-peer":
      case "missing-required-provider":
        recommendationSet.add("Run lattice add <component> to install missing peers/providers for the component.");
        break;
      case "missing-optional-provider":
        recommendationSet.add("Install optional providers only when the related runtime provider is required.");
        break;
      default:
        break;
    }
  }

  return [...recommendationSet];
}

export async function runDoctorCommand(ctx: CliContext): Promise<void> {
  const manifest = await readPackageJson(ctx.projectRoot);
  const installedDependencies = getDependencyNames(manifest);

  const issues: Issue[] = [];

  if (ctx.detectedLockfiles.length === 0) {
    issues.push({
      code: "missing-lockfile",
      level: "warn",
      message: "No lockfile found. Detected package manager defaults to npm.",
    });
  }

  if (ctx.detectedLockfiles.length > 1) {
    issues.push({
      code: "multiple-lockfiles",
      level: "warn",
      message: `Multiple lockfiles detected: ${ctx.detectedLockfiles.join(", ")}. Using ${ctx.pmName}.`,
    });
  }

  if (typeof manifest.packageManager === "string" && manifest.packageManager.length > 0) {
    const normalized = manifest.packageManager.split("@")[0];
    if (normalized !== ctx.pmName) {
      issues.push({
        code: "package-manager-mismatch",
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
      code: "missing-lattice-packages",
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
        code: "unknown-lattice-package",
        level: "warn",
        message: `${npmPackage} is installed but not found in CLI registry.`,
      });
      continue;
    }

    const entry = ctx.registry.packages[componentName];

    for (const peer of entry.peers ?? []) {
      if (!installedDependencies.has(peer)) {
        issues.push({
          code: "missing-peer",
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
          code: "missing-optional-provider",
          level: "warn",
          message: `${componentName} optional provider not found: ${provider.raw}`,
        });
      } else {
        issues.push({
          code: "missing-required-provider",
          level: "error",
          message: `${componentName} required provider missing: ${provider.raw}`,
        });
      }
    }
  }

  const warnings = issues.filter((issue) => issue.level === "warn");
  const errors = issues.filter((issue) => issue.level === "error");

  ctx.logger.info("doctor summary:");
  ctx.logger.info(`  errors: ${errors.length}`);
  ctx.logger.info(`  warnings: ${warnings.length}`);

  if (errors.length > 0) {
    ctx.logger.info("Errors:");
    for (const issue of errors) {
      ctx.logger.error(issue.message);
    }
  }

  if (warnings.length > 0) {
    ctx.logger.info("Warnings:");
    for (const issue of warnings) {
      ctx.logger.warn(issue.message);
    }
  }

  const recommendations = collectRecommendations(issues);
  if (recommendations.length > 0) {
    ctx.logger.info("Recommended next steps:");
    for (const recommendation of recommendations) {
      ctx.logger.info(`- ${recommendation}`);
    }
  }

  if (errors.length > 0) {
    throw validationError(`doctor found ${errors.length} error(s) and ${warnings.length} warning(s).`);
  }

  if (warnings.length > 0) {
    ctx.logger.success(`doctor completed with ${warnings.length} warning(s).`);
  } else {
    ctx.logger.success("doctor found no issues.");
  }
}
