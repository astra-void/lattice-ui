import { promises as fs } from "node:fs";
import * as path from "node:path";
import { projectNotFoundError, usageError } from "../core/errors";
import { type CopyTemplateReport, copyTemplateSafe } from "../core/fs/copy";
import { createLogger } from "../core/logger";
import { resolveLatestVersions } from "../core/npm/latest";
import { resolveLocalLatticeCommand, summarizeItems } from "../core/output";
import { detectPackageManager } from "../core/pm/detect";
import type { PackageManagerName } from "../core/pm/types";
import { findRoot } from "../core/project/findRoot";
import type { PackageJson } from "../core/project/readPackageJson";
import { readPackageJson } from "../core/project/readPackageJson";
import { writePackageJson } from "../core/project/writePackageJson";
import { type PromptRuntime, promptConfirm, promptSelect } from "../core/prompt";

export interface InitCommandInput {
  cwd: string;
  pm?: string;
  yes: boolean;
  dryRun: boolean;
  template?: string;
  lint?: boolean;
}

interface InitCommandRuntimeOverrides {
  detectPackageManagerFn?: typeof detectPackageManager;
  resolveLatestVersionsFn?: typeof resolveLatestVersions;
  createLoggerFn?: typeof createLogger;
  promptSelectFn?: typeof promptSelect;
  promptConfirmFn?: typeof promptConfirm;
}

interface ManifestPlan {
  changed: boolean;
  nextManifest: PackageJson;
  addedScripts: string[];
  addedDependencies: string[];
  addedDevDependencies: string[];
}

interface GitignorePlan {
  changed: boolean;
  created: boolean;
  addedEntries: string[];
  nextContent: string;
}

const SUPPORTED_TEMPLATE = "rbxts";
const GITIGNORE_ENTRIES = ["node_modules", "out"] as const;

const CORE_VERSION_PACKAGES = {
  latticeStyle: "@lattice-ui/style",
  latticeCli: "@lattice-ui/cli",
  rbxtsReact: "@rbxts/react",
  rbxtsReactRoblox: "@rbxts/react-roblox",
  rbxtsCompilerTypes: "@rbxts/compiler-types",
  rbxtsTypes: "@rbxts/types",
  robloxTs: "roblox-ts",
  typescript: "typescript",
} as const;

const LINT_VERSION_PACKAGES = {
  eslint: "eslint",
  eslintEslintrc: "@eslint/eslintrc",
  eslintJs: "@eslint/js",
  eslintConfigPrettier: "eslint-config-prettier",
  eslintPluginPrettier: "eslint-plugin-prettier",
  eslintPluginRobloxTs: "eslint-plugin-roblox-ts",
  typescriptEslintPlugin: "@typescript-eslint/eslint-plugin",
  typescriptEslintParser: "@typescript-eslint/parser",
  prettier: "prettier",
} as const;

function normalizeTemplate(template: string | undefined): string {
  const value = template?.trim();
  if (!value || value.length === 0) {
    return SUPPORTED_TEMPLATE;
  }

  return value;
}

function normalizePackageManager(pm: string | undefined): PackageManagerName | undefined {
  if (!pm) {
    return undefined;
  }

  if (pm === "npm" || pm === "pnpm" || pm === "yarn") {
    return pm;
  }

  throw usageError(`Invalid --pm value "${pm}". Use pnpm, npm, or yarn.`);
}

async function selectTemplate(providedTemplate: string | undefined): Promise<string> {
  const normalized = normalizeTemplate(providedTemplate);

  if (normalized !== SUPPORTED_TEMPLATE) {
    throw usageError(`Unknown template: ${normalized}. Supported template: ${SUPPORTED_TEMPLATE}.`);
  }

  return normalized;
}

function getPackageManagerDefaultIndex(packageManager: PackageManagerName): number {
  if (packageManager === "npm") {
    return 0;
  }

  if (packageManager === "pnpm") {
    return 1;
  }

  return 2;
}

async function selectPackageManager(
  runtime: PromptRuntime,
  providedPm: string | undefined,
  detectedPm: PackageManagerName,
  promptSelectFn: typeof promptSelect,
): Promise<PackageManagerName> {
  const normalized = normalizePackageManager(providedPm);
  if (normalized) {
    return normalized;
  }

  if (runtime.yes) {
    return detectedPm;
  }

  return promptSelectFn(
    runtime,
    "Select a package manager",
    [
      { label: "npm", value: "npm" as const },
      { label: "pnpm", value: "pnpm" as const },
      { label: "yarn", value: "yarn" as const },
    ],
    { defaultIndex: getPackageManagerDefaultIndex(detectedPm) },
  );
}

async function selectLintEnabled(
  runtime: PromptRuntime,
  providedLint: boolean | undefined,
  promptConfirmFn: typeof promptConfirm,
): Promise<boolean> {
  if (providedLint !== undefined) {
    return providedLint;
  }

  if (runtime.yes) {
    return false;
  }

  return promptConfirmFn(runtime, "Set up ESLint + Prettier?", { defaultValue: false });
}

async function readTemplateJson<T>(
  templateDir: string,
  fileName: string,
  replacements: Record<string, string>,
): Promise<T> {
  const filePath = path.join(templateDir, fileName);
  const raw = await fs.readFile(filePath, "utf8");

  let content = raw;
  for (const [from, to] of Object.entries(replacements)) {
    content = content.split(from).join(to);
  }

  return JSON.parse(content) as T;
}

function sortStringRecord(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(record).sort(([left], [right]) => left.localeCompare(right)));
}

function mergeMissingRecord(
  current: Record<string, string> | undefined,
  incoming: Record<string, string> | undefined,
  options?: { sortKeys?: boolean },
): {
  changed: boolean;
  next: Record<string, string> | undefined;
  added: string[];
} {
  if (!incoming || Object.keys(incoming).length === 0) {
    return {
      changed: false,
      next: current,
      added: [],
    };
  }

  const next = { ...(current ?? {}) };
  const added: string[] = [];

  for (const [key, value] of Object.entries(incoming)) {
    if (next[key] !== undefined) {
      continue;
    }

    next[key] = value;
    added.push(key);
  }

  if (added.length === 0) {
    return {
      changed: false,
      next: current,
      added,
    };
  }

  return {
    changed: true,
    next: options?.sortKeys ? sortStringRecord(next) : next,
    added,
  };
}

function planManifestChanges(currentManifest: PackageJson, templates: PackageJson[]): ManifestPlan {
  let nextManifest: PackageJson = { ...currentManifest };
  const addedScripts: string[] = [];
  const addedDependencies: string[] = [];
  const addedDevDependencies: string[] = [];
  let changed = false;

  for (const template of templates) {
    const scripts = mergeMissingRecord(nextManifest.scripts, template.scripts);
    if (scripts.changed) {
      nextManifest = {
        ...nextManifest,
        scripts: scripts.next,
      };
      addedScripts.push(...scripts.added);
      changed = true;
    }

    const dependencies = mergeMissingRecord(nextManifest.dependencies, template.dependencies, { sortKeys: true });
    if (dependencies.changed) {
      nextManifest = {
        ...nextManifest,
        dependencies: dependencies.next,
      };
      addedDependencies.push(...dependencies.added);
      changed = true;
    }

    const devDependencies = mergeMissingRecord(nextManifest.devDependencies, template.devDependencies, {
      sortKeys: true,
    });
    if (devDependencies.changed) {
      nextManifest = {
        ...nextManifest,
        devDependencies: devDependencies.next,
      };
      addedDevDependencies.push(...devDependencies.added);
      changed = true;
    }
  }

  return {
    changed,
    nextManifest,
    addedScripts: [...new Set(addedScripts)],
    addedDependencies: [...new Set(addedDependencies)],
    addedDevDependencies: [...new Set(addedDevDependencies)],
  };
}

async function planGitignore(projectRoot: string): Promise<GitignorePlan> {
  const gitignorePath = path.join(projectRoot, ".gitignore");

  let currentContent = "";
  let exists = true;
  try {
    currentContent = await fs.readFile(gitignorePath, "utf8");
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code !== "ENOENT") {
      throw error;
    }

    exists = false;
  }

  const existingEntries = new Set(
    currentContent
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0),
  );

  const addedEntries = GITIGNORE_ENTRIES.filter((entry) => !existingEntries.has(entry));
  if (addedEntries.length === 0) {
    return {
      changed: false,
      created: false,
      addedEntries: [],
      nextContent: currentContent,
    };
  }

  let nextContent = currentContent;
  if (nextContent.length > 0 && !nextContent.endsWith("\n")) {
    nextContent += "\n";
  }
  nextContent += `${addedEntries.join("\n")}\n`;

  return {
    changed: true,
    created: !exists,
    addedEntries,
    nextContent,
  };
}

function buildVersionReplacements(versions: Record<string, string>): Record<string, string> {
  return {
    __LATTICE_STYLE_VERSION__: versions[CORE_VERSION_PACKAGES.latticeStyle],
    __LATTICE_CLI_VERSION__: versions[CORE_VERSION_PACKAGES.latticeCli],
    __RBXTS_REACT_VERSION__: versions[CORE_VERSION_PACKAGES.rbxtsReact],
    __RBXTS_REACT_ROBLOX_VERSION__: versions[CORE_VERSION_PACKAGES.rbxtsReactRoblox],
    __RBXTS_COMPILER_TYPES_VERSION__: versions[CORE_VERSION_PACKAGES.rbxtsCompilerTypes],
    __RBXTS_TYPES_VERSION__: versions[CORE_VERSION_PACKAGES.rbxtsTypes],
    __ROBLOX_TS_VERSION__: versions[CORE_VERSION_PACKAGES.robloxTs],
    __TYPESCRIPT_VERSION__: versions[CORE_VERSION_PACKAGES.typescript],
    __ESLINT_VERSION__: versions[LINT_VERSION_PACKAGES.eslint] ?? "",
    __ESLINT_ESLINTRC_VERSION__: versions[LINT_VERSION_PACKAGES.eslintEslintrc] ?? "",
    __ESLINT_JS_VERSION__: versions[LINT_VERSION_PACKAGES.eslintJs] ?? "",
    __ESLINT_CONFIG_PRETTIER_VERSION__: versions[LINT_VERSION_PACKAGES.eslintConfigPrettier] ?? "",
    __ESLINT_PLUGIN_PRETTIER_VERSION__: versions[LINT_VERSION_PACKAGES.eslintPluginPrettier] ?? "",
    __ESLINT_PLUGIN_ROBLOX_TS_VERSION__: versions[LINT_VERSION_PACKAGES.eslintPluginRobloxTs] ?? "",
    __TYPESCRIPT_ESLINT_PLUGIN_VERSION__: versions[LINT_VERSION_PACKAGES.typescriptEslintPlugin] ?? "",
    __TYPESCRIPT_ESLINT_PARSER_VERSION__: versions[LINT_VERSION_PACKAGES.typescriptEslintParser] ?? "",
    __PRETTIER_VERSION__: versions[LINT_VERSION_PACKAGES.prettier] ?? "",
  };
}

function collectChangedFiles(
  templateReport: CopyTemplateReport,
  lintReport: CopyTemplateReport | undefined,
  manifestPlan: ManifestPlan,
  gitignorePlan: GitignorePlan,
): string[] {
  const files = [
    ...templateReport.created,
    ...templateReport.merged,
    ...(lintReport ? [...lintReport.created, ...lintReport.merged] : []),
  ];

  if (manifestPlan.changed) {
    files.push("package.json");
  }

  if (gitignorePlan.changed) {
    files.push(".gitignore");
  }

  return [...new Set(files)].sort((left, right) => left.localeCompare(right));
}

function countCreatedFiles(
  templateReport: CopyTemplateReport,
  lintReport: CopyTemplateReport | undefined,
  gitignorePlan: GitignorePlan,
): number {
  return templateReport.created.length + (lintReport?.created.length ?? 0) + (gitignorePlan.created ? 1 : 0);
}

function countMergedFiles(
  templateReport: CopyTemplateReport,
  lintReport: CopyTemplateReport | undefined,
  manifestPlan: ManifestPlan,
  gitignorePlan: GitignorePlan,
): number {
  return (
    templateReport.merged.length +
    (lintReport?.merged.length ?? 0) +
    (manifestPlan.changed ? 1 : 0) +
    (gitignorePlan.changed && !gitignorePlan.created ? 1 : 0)
  );
}

export async function runInitCommand(
  input: InitCommandInput,
  runtimeOverrides?: InitCommandRuntimeOverrides,
): Promise<void> {
  const detectPackageManagerFn = runtimeOverrides?.detectPackageManagerFn ?? detectPackageManager;
  const resolveLatestVersionsFn = runtimeOverrides?.resolveLatestVersionsFn ?? resolveLatestVersions;
  const createLoggerFn = runtimeOverrides?.createLoggerFn ?? createLogger;
  const promptSelectFn = runtimeOverrides?.promptSelectFn ?? promptSelect;
  const promptConfirmFn = runtimeOverrides?.promptConfirmFn ?? promptConfirm;
  const runtime: PromptRuntime = { yes: input.yes };

  const cwd = path.resolve(input.cwd);
  const projectRoot = await findRoot(cwd);
  if (!projectRoot) {
    throw projectNotFoundError(cwd);
  }

  const template = await selectTemplate(input.template);
  const detectedPm = await detectPackageManagerFn(projectRoot);
  const packageManager = await selectPackageManager(runtime, input.pm, detectedPm.name, promptSelectFn);
  const lintEnabled = await selectLintEnabled(runtime, input.lint, promptConfirmFn);
  const resolvedPm = await detectPackageManagerFn(projectRoot, packageManager);

  const logger = createLoggerFn({
    verbose: false,
    yes: input.yes,
  });

  logger.section("Inspecting");
  logger.kv("Project", projectRoot);
  logger.kv("Template", template);
  logger.kv("Detected package manager", detectedPm.name);
  logger.kv("Package manager", resolvedPm.name);
  logger.kv("Lint/format", lintEnabled ? "enabled" : "disabled");

  const packagesToResolve = [
    ...Object.values(CORE_VERSION_PACKAGES),
    ...(lintEnabled ? Object.values(LINT_VERSION_PACKAGES) : []),
  ];
  const versions = await resolveLatestVersionsFn(packagesToResolve);
  const replacements = buildVersionReplacements(versions);

  const templateDir = path.resolve(__dirname, "../../templates/init");
  const lintTemplateDir = path.resolve(__dirname, "../../templates/init-lint");
  const templateManifest = await readTemplateJson<PackageJson>(templateDir, "package.json", replacements);
  const lintManifest = lintEnabled
    ? await readTemplateJson<PackageJson>(lintTemplateDir, "package.json", replacements)
    : undefined;
  const currentManifest = await readPackageJson(projectRoot);

  const templateReport = await copyTemplateSafe(templateDir, projectRoot, {
    dryRun: true,
    logger,
    replacements,
    shouldIncludeFile: (relativePath) => relativePath !== "package.json",
  });
  const lintReport = lintEnabled
    ? await copyTemplateSafe(lintTemplateDir, projectRoot, {
        dryRun: true,
        logger,
        replacements,
        shouldIncludeFile: (relativePath) => relativePath !== "package.json",
      })
    : undefined;
  const manifestPlan = planManifestChanges(
    currentManifest,
    lintManifest ? [templateManifest, lintManifest] : [templateManifest],
  );
  const gitignorePlan = await planGitignore(projectRoot);
  const changedFiles = collectChangedFiles(templateReport, lintReport, manifestPlan, gitignorePlan);
  const addedPackages = [...new Set([...manifestPlan.addedDependencies, ...manifestPlan.addedDevDependencies])].sort(
    (left, right) => left.localeCompare(right),
  );
  const createdCount = countCreatedFiles(templateReport, lintReport, gitignorePlan);
  const mergedCount = countMergedFiles(templateReport, lintReport, manifestPlan, gitignorePlan);
  const localLattice = resolveLocalLatticeCommand(resolvedPm.name);

  logger.section("Planning");
  logger.kv("Files to create", String(createdCount));
  logger.kv("Files to merge", String(mergedCount));
  logger.kv("Scripts to add", String(manifestPlan.addedScripts.length));
  logger.kv("Packages to add", String(addedPackages.length));

  const changedFileSummary = summarizeItems(changedFiles);
  if (changedFileSummary.total > 0) {
    logger.list(changedFileSummary.visible);
    if (changedFileSummary.hidden > 0) {
      logger.step(`...and ${changedFileSummary.hidden} more`);
    }
  }

  if (manifestPlan.addedScripts.length > 0) {
    const scriptSummary = summarizeItems(manifestPlan.addedScripts);
    logger.kv("New scripts", String(scriptSummary.total));
    logger.list(scriptSummary.visible);
    if (scriptSummary.hidden > 0) {
      logger.step(`...and ${scriptSummary.hidden} more`);
    }
  }

  if (addedPackages.length > 0) {
    const packageSummary = summarizeItems(addedPackages);
    logger.kv("New dependencies", String(packageSummary.total));
    logger.list(packageSummary.visible);
    if (packageSummary.hidden > 0) {
      logger.step(`...and ${packageSummary.hidden} more`);
    }
  }

  if (input.dryRun) {
    logger.section("Dry Run");
    if (changedFiles.length === 0) {
      logger.step("[dry-run] No file changes required.");
    } else {
      for (const filePath of changedFileSummary.visible) {
        logger.step(`[dry-run] update ${filePath}`);
      }
      if (changedFileSummary.hidden > 0) {
        logger.step(`[dry-run] ...and ${changedFileSummary.hidden} more file changes`);
      }
    }

    if (manifestPlan.changed) {
      logger.step(`[dry-run] ${resolvedPm.name} install`);
    } else {
      logger.step("[dry-run] No install required.");
    }
  } else {
    logger.section("Applying");
    if (changedFiles.length === 0) {
      logger.step("Project already has the required Lattice bootstrap files.");
    } else {
      const confirmed = await logger.confirm(`Apply ${changedFiles.length} planned change(s) in ${projectRoot}?`);
      if (!confirmed) {
        logger.section("Result");
        logger.warn("Init command cancelled.");
        logger.section("Next Steps");
        logger.step(`${localLattice} doctor`);
        return;
      }

      await copyTemplateSafe(templateDir, projectRoot, {
        dryRun: false,
        logger,
        replacements,
        shouldIncludeFile: (relativePath) => relativePath !== "package.json",
      });

      if (lintEnabled) {
        await copyTemplateSafe(lintTemplateDir, projectRoot, {
          dryRun: false,
          logger,
          replacements,
          shouldIncludeFile: (relativePath) => relativePath !== "package.json",
        });
      }

      if (manifestPlan.changed) {
        await writePackageJson(projectRoot, manifestPlan.nextManifest);
      }

      if (gitignorePlan.changed) {
        await fs.writeFile(path.join(projectRoot, ".gitignore"), gitignorePlan.nextContent, "utf8");
      }

      if (manifestPlan.changed) {
        const installSpinner = logger.spinner(`Installing dependencies with ${resolvedPm.name}...`);
        await resolvedPm.manager.install(projectRoot);
        installSpinner.succeed("Dependencies installed.");
      } else {
        logger.step("No dependency installation required.");
      }
    }
  }

  logger.section("Result");
  if (changedFiles.length === 0) {
    logger.success("Project already matches the Lattice init template.");
  } else if (input.dryRun) {
    logger.success(`Dry run complete. Planned ${changedFiles.length} file change(s).`);
  } else {
    logger.success(`Initialized Lattice in ${path.basename(projectRoot)}.`);
  }
  logger.kv("Files created", String(createdCount));
  logger.kv("Files merged", String(mergedCount));
  logger.kv("Dependencies added", String(addedPackages.length));

  logger.section("Next Steps");
  logger.step(`${localLattice} doctor`);
  logger.step(`${resolvedPm.name} run build`);
  logger.step(`${localLattice} add --preset form`);
}
