import { validationError } from "../core/errors";
import { getDependencyNames } from "../core/fs/patch";
import { resolveLocalLatticeCommand, summarizeItems } from "../core/output";
import type { PackageManagerName } from "../core/pm/types";
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

const LATTICE_TOOLING_PACKAGES = new Set<string>(["@lattice-ui/cli"]);

function collectRecommendations(issues: Issue[], pmName: PackageManagerName): string[] {
  const recommendationSet = new Set<string>();
  const localLattice = resolveLocalLatticeCommand(pmName);

  for (const issue of issues) {
    switch (issue.code) {
      case "missing-lockfile":
        recommendationSet.add(`${pmName} install`);
        break;
      case "multiple-lockfiles":
        recommendationSet.add("Remove extra lockfiles and keep exactly one package manager lockfile.");
        break;
      case "package-manager-mismatch":
        recommendationSet.add("Update package.json packageManager to match the active lockfile manager.");
        break;
      case "missing-lattice-packages":
        recommendationSet.add(`${localLattice} add <component>`);
        break;
      case "unknown-lattice-package":
        recommendationSet.add(`${localLattice} upgrade`);
        break;
      case "missing-peer":
      case "missing-required-provider":
        recommendationSet.add(`${localLattice} add <component>`);
        break;
      case "missing-optional-provider":
        recommendationSet.add(`${localLattice} add <component>`);
        break;
      default:
        break;
    }
  }

  return [...recommendationSet];
}

export async function runDoctorCommand(ctx: CliContext): Promise<void> {
  ctx.logger.section("Checking");
  ctx.logger.kv("Project", ctx.projectRoot);
  ctx.logger.kv("Resolved package manager", ctx.pmName);

  const manifest = await readPackageJson(ctx.projectRoot);
  const installedDependencies = getDependencyNames(manifest);

  const issues: Issue[] = [];

  if (ctx.detectedLockfiles.length === 0) {
    issues.push({
      code: "missing-lockfile",
      level: "warn",
      message: `No lockfile found. Resolved package manager is ${ctx.pmName}.`,
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
        message: `packageManager field is ${manifest.packageManager} but resolved ${ctx.pmName}.`,
      });
    }
  }

  const installedLattice = [...installedDependencies]
    .filter((name) => name.startsWith("@lattice-ui/"))
    .sort((left, right) => left.localeCompare(right));
  const installedLatticeComponents = installedLattice.filter((name) => !LATTICE_TOOLING_PACKAGES.has(name));

  if (installedLatticeComponents.length === 0) {
    issues.push({
      code: "missing-lattice-packages",
      level: "warn",
      message: "No @lattice-ui component packages are installed.",
    });
  }

  const componentByNpm = new Map<string, string>();
  for (const [componentName, entry] of Object.entries(ctx.registry.packages)) {
    componentByNpm.set(entry.npm, componentName);
  }

  for (const npmPackage of installedLatticeComponents) {
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

  ctx.logger.section("Summary");
  ctx.logger.kv("Errors", String(errors.length));
  ctx.logger.kv("Warnings", String(warnings.length));

  if (warnings.length > 0) {
    ctx.logger.section("Warnings");
    ctx.logger.list(warnings.map((issue) => issue.message));
  }

  if (errors.length > 0) {
    ctx.logger.section("Errors");
    ctx.logger.list(errors.map((issue) => issue.message));
  }

  const recommendations = collectRecommendations(issues, ctx.pmName);
  if (recommendations.length > 0) {
    ctx.logger.section("Recommended Commands");
    const recommendationSummary = summarizeItems(recommendations);
    ctx.logger.list(recommendationSummary.visible);
    if (recommendationSummary.hidden > 0) {
      ctx.logger.step(`...and ${recommendationSummary.hidden} more`);
    }
  }

  ctx.logger.section("Result");
  if (errors.length > 0) {
    const message = `doctor found ${errors.length} error(s) and ${warnings.length} warning(s).`;
    ctx.logger.error(message);
    throw validationError(message);
  }

  if (warnings.length > 0) {
    ctx.logger.success(`doctor completed with ${warnings.length} warning(s).`);
  } else {
    ctx.logger.success("doctor found no issues.");
  }
}
