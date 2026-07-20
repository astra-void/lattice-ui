import { asReported, validationError } from "../core/errors";
import { getDependencyNames, type PackageJsonLike } from "../core/fs/patch";
import { PINNED_VERSIONS } from "../core/npm/pins";
import { describePackageManager, linkPath, plural, resolveLocalLatticeCommand, summarizeItems } from "../core/output";
import type { PackageManagerName } from "../core/pm/types";
import { LEGACY_PACKAGE_RENAMES } from "../core/project/legacyPackages";
import { readPackageJson } from "../core/project/readPackageJson";
import { parseProviderRequirement } from "../core/registry/schema";
import type { CliContext } from "../ctx";

type IssueLevel = "warn" | "error";

type IssueCode =
  | "missing-lockfile"
  | "multiple-lockfiles"
  | "package-manager-mismatch"
  | "missing-lattice-packages"
  | "legacy-lattice-package"
  | "unsupported-typescript"
  | "unknown-lattice-package"
  | "missing-peer"
  | "missing-optional-provider"
  | "missing-required-provider";

type Issue = {
  code: IssueCode;
  level: IssueLevel;
  message: string;
};

const LATTICE_TOOLING_PACKAGES = new Set<string>(["lattice-ui"]);

/**
 * roblox-ts compiles with an exact TypeScript version, so a project on a different major
 * type-checks against a compiler its build never uses — and npm refuses to install the
 * lint preset at all once the major moves past the @typescript-eslint peer range.
 */
function findUnsupportedTypescript(manifest: PackageJsonLike): string | undefined {
  const spec = manifest.dependencies?.typescript ?? manifest.devDependencies?.typescript;
  if (spec === undefined) {
    return undefined;
  }

  const supportedMajor = PINNED_VERSIONS.typescript.split(".")[0];
  const listedMajor = spec.replace(/^[\^~>=<\s]*/, "").split(".")[0];

  return listedMajor === supportedMajor ? undefined : spec;
}

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
      case "legacy-lattice-package":
        recommendationSet.add(`${localLattice} init`);
        break;
      case "unsupported-typescript":
        recommendationSet.add(`${pmName} install -D typescript@${PINNED_VERSIONS.typescript}`);
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
  ctx.logger.header("lattice doctor");
  ctx.logger.fields([
    ["Project", linkPath(ctx.projectRoot, ctx.cwd)],
    ["Manager", describePackageManager(ctx.pmName, ctx.pmResolutionSource)],
  ]);

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

  const unsupportedTypescript = findUnsupportedTypescript(manifest);
  if (unsupportedTypescript !== undefined) {
    issues.push({
      code: "unsupported-typescript",
      level: "warn",
      message: `typescript is pinned to ${unsupportedTypescript}, but roblox-ts compiles with ${PINNED_VERSIONS.typescript}.`,
    });
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
    const replacement = LEGACY_PACKAGE_RENAMES[npmPackage];
    if (replacement !== undefined) {
      issues.push({
        code: "legacy-lattice-package",
        level: "error",
        message: `${npmPackage} was renamed to ${replacement}; the old name no longer receives releases.`,
      });
      continue;
    }

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

  // The counts live in the group headings, so there is no separate summary block restating them.
  if (errors.length > 0) {
    ctx.logger.group(
      `${errors.length} ${plural(errors.length, "error")}`,
      errors.map((issue) => issue.message),
      { tone: "error" },
    );
  }

  if (warnings.length > 0) {
    ctx.logger.group(
      `${warnings.length} ${plural(warnings.length, "warning")}`,
      warnings.map((issue) => issue.message),
      { tone: "warn" },
    );
  }

  // Every path closes with a verdict, so the run always terminates visually. The verdict states
  // the outcome rather than restating the counts already carried by the group headings.
  if (errors.length > 0) {
    ctx.logger.outcome(`Failed with ${errors.length} ${plural(errors.length, "error")}.`, "error");
  } else if (warnings.length > 0) {
    ctx.logger.outcome("Passed with warnings.", "warn");
  } else {
    ctx.logger.outcome("No issues found.");
  }

  ctx.logger.next(summarizeItems(collectRecommendations(issues, ctx.pmName)).visible);

  if (errors.length > 0) {
    // The verdict above is the user-facing report; this only carries the exit code.
    throw asReported(
      validationError(
        `doctor found ${errors.length} ${plural(errors.length, "error")} and ${warnings.length} ${plural(warnings.length, "warning")}.`,
      ),
    );
  }
}
