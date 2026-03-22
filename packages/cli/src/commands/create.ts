import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { packageManagerFailedError, usageError } from "../core/errors";
import { copyTemplateSafe } from "../core/fs/copy";
import { createLogger } from "../core/logger";
import { resolveLatestVersions } from "../core/npm/latest";
import { resolveLocalLatticeCommand } from "../core/output";
import { detectPackageManager } from "../core/pm/detect";
import type { PackageManagerName } from "../core/pm/types";
import { type PromptRuntime, promptConfirm, promptInput, promptSelect } from "../core/prompt";

export interface CreateCommandInput {
  cwd: string;
  projectPath?: string;
  pm?: string;
  yes: boolean;
  git?: boolean;
  template?: string;
  lint?: boolean;
}

interface CreateCommandRuntimeOverrides {
  detectPackageManagerFn?: typeof detectPackageManager;
  resolveLatestVersionsFn?: typeof resolveLatestVersions;
  runProcessFn?: (command: string, args: string[], cwd: string) => Promise<void>;
  createLoggerFn?: typeof createLogger;
  promptInputFn?: typeof promptInput;
  promptSelectFn?: typeof promptSelect;
}

const SUPPORTED_TEMPLATE = "rbxts";

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

const GITIGNORE_ENTRIES = [
  "node_modules",
  "out",
  "include",
  "*.rbxl",
  "*.rbxlx",
  "*.rbxm",
  "*.rbxmx",
  "*.rbxl.lock",
  "*.rbxlx.lock",
  "*.rbxm.lock",
  "*.rbxmx.lock",
  "*.tsbuildinfo",
  ".pnpm-store",
  ".DS_Store",
] as const;
const GITIGNORE_CONTENT = `${GITIGNORE_ENTRIES.join("\n")}\n`;
const PROJECT_DIRECTORIES = ["include", "out/shared", "out/server", "out/client"] as const;
const PNPM_NPMRC_PATH = ".npmrc";
const PNPM_NODE_LINKER_LINE = "node-linker=hoisted";

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

function normalizeProjectPath(projectPath: string): string {
  const trimmed = projectPath.trim();
  if (trimmed.length === 0) {
    throw usageError("create requires a non-empty <project-path>.");
  }

  if (path.isAbsolute(trimmed)) {
    throw usageError("create only accepts relative project paths.");
  }

  const normalized = path.normalize(trimmed);
  const parts = normalized.split(path.sep).filter((part) => part.length > 0);
  if (parts.length === 0 || parts.some((part) => part === "." || part === "..")) {
    throw usageError("create does not allow '.', '..', or parent-relative paths.");
  }

  return normalized;
}

async function ensureEmptyDirectory(targetRoot: string): Promise<void> {
  try {
    const stat = await fs.stat(targetRoot);
    if (!stat.isDirectory()) {
      throw usageError(`Target path exists and is not a directory: ${targetRoot}`);
    }

    const entries = await fs.readdir(targetRoot);
    if (entries.length > 0) {
      throw usageError(`Target directory must be empty: ${targetRoot}`);
    }
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code !== "ENOENT") {
      throw error;
    }

    await fs.mkdir(targetRoot, { recursive: true });
  }
}

async function runProcess(command: string, args: string[], cwd: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("error", (error) => {
      reject(packageManagerFailedError(`Failed to run ${command}: ${error.message}`, error));
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(packageManagerFailedError(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}.`));
    });
  });
}

async function ensureGitignoreExists(targetRoot: string): Promise<void> {
  const gitignorePath = path.join(targetRoot, ".gitignore");

  try {
    await fs.access(gitignorePath);
  } catch {
    await fs.writeFile(gitignorePath, GITIGNORE_CONTENT, "utf8");
  }
}

async function ensureProjectDirectories(targetRoot: string): Promise<void> {
  await Promise.all(
    PROJECT_DIRECTORIES.map((directory) => fs.mkdir(path.join(targetRoot, directory), { recursive: true })),
  );
}

function normalizeTemplate(template: string | undefined): string {
  const value = template?.trim();
  if (!value || value.length === 0) {
    return SUPPORTED_TEMPLATE;
  }

  return value;
}

async function ensurePnpmNodeLinkerConfig(targetRoot: string, packageManager: PackageManagerName): Promise<void> {
  if (packageManager !== "pnpm") {
    return;
  }

  const npmrcPath = path.join(targetRoot, PNPM_NPMRC_PATH);

  try {
    const currentContent = await fs.readFile(npmrcPath, "utf8");
    const eol = currentContent.includes("\r\n") ? "\r\n" : "\n";
    const lines = currentContent.split(/\r?\n/);
    const nodeLinkerIndex = lines.findIndex((line) => /^\s*node-linker\s*=/.test(line));

    if (nodeLinkerIndex >= 0) {
      if (lines[nodeLinkerIndex].trim() === PNPM_NODE_LINKER_LINE) {
        return;
      }

      lines[nodeLinkerIndex] = PNPM_NODE_LINKER_LINE;
      await fs.writeFile(npmrcPath, lines.join(eol), "utf8");
      return;
    }

    const nextContent = currentContent.endsWith("\n")
      ? `${currentContent}${PNPM_NODE_LINKER_LINE}${eol}`
      : `${currentContent}${eol}${PNPM_NODE_LINKER_LINE}${eol}`;
    await fs.writeFile(npmrcPath, nextContent, "utf8");
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code !== "ENOENT") {
      throw error;
    }

    await fs.writeFile(npmrcPath, `${PNPM_NODE_LINKER_LINE}\n`, "utf8");
  }
}

async function selectTemplate(providedTemplate: string | undefined): Promise<string> {
  const normalized = normalizeTemplate(providedTemplate);

  if (normalized !== SUPPORTED_TEMPLATE) {
    throw usageError(`Unknown template: ${normalized}. Supported template: ${SUPPORTED_TEMPLATE}.`);
  }

  return normalized;
}

async function selectGitEnabled(runtime: PromptRuntime, providedGit: boolean | undefined): Promise<boolean> {
  if (providedGit !== undefined) {
    return providedGit;
  }

  return promptConfirm(runtime, "Initialize a git repository?", { defaultValue: false });
}

async function selectLintEnabled(runtime: PromptRuntime, providedLint: boolean | undefined): Promise<boolean> {
  if (providedLint !== undefined) {
    return providedLint;
  }

  if (runtime.yes) {
    return true;
  }

  return promptConfirm(runtime, "Set up ESLint + Prettier?", { defaultValue: true });
}

async function resolveProjectPath(
  runtime: PromptRuntime,
  projectPath: string | undefined,
  promptInputFn: typeof promptInput,
): Promise<string> {
  const value = projectPath?.trim();
  if (value && value.length > 0) {
    return value;
  }

  if (runtime.yes) {
    throw usageError("create requires [project-path] when using --yes.");
  }

  return promptInputFn(runtime, "What is your project named?", { required: true });
}

export async function runCreateCommand(
  input: CreateCommandInput,
  runtimeOverrides?: CreateCommandRuntimeOverrides,
): Promise<void> {
  const detectPackageManagerFn = runtimeOverrides?.detectPackageManagerFn ?? detectPackageManager;
  const resolveLatestVersionsFn = runtimeOverrides?.resolveLatestVersionsFn ?? resolveLatestVersions;
  const runProcessFn = runtimeOverrides?.runProcessFn ?? runProcess;
  const createLoggerFn = runtimeOverrides?.createLoggerFn ?? createLogger;
  const promptInputFn = runtimeOverrides?.promptInputFn ?? promptInput;
  const promptSelectFn = runtimeOverrides?.promptSelectFn ?? promptSelect;

  const runtime: PromptRuntime = { yes: input.yes };

  const template = await selectTemplate(input.template);
  if (template !== SUPPORTED_TEMPLATE) {
    throw usageError(`Unsupported template: ${template}`);
  }

  const gitEnabled = await selectGitEnabled(runtime, input.git);
  const lintEnabled = await selectLintEnabled(runtime, input.lint);

  const providedProjectPath = await resolveProjectPath(runtime, input.projectPath, promptInputFn);
  const relativeProjectPath = normalizeProjectPath(providedProjectPath);
  const targetRoot = path.resolve(input.cwd, relativeProjectPath);

  await ensureEmptyDirectory(targetRoot);

  const logger = createLoggerFn({
    verbose: false,
    yes: input.yes,
  });

  const resolvedPm = await detectPackageManagerFn(targetRoot, input.pm, {
    runtime,
    promptSelectFn,
  });
  let packageManagerSourceLabel: string;
  switch (resolvedPm.source) {
    case "override":
      packageManagerSourceLabel = "explicit --pm";
      break;
    case "lockfile":
      packageManagerSourceLabel = "lockfile";
      break;
    case "installed":
      packageManagerSourceLabel = "only installed package manager";
      break;
    case "prompt":
      packageManagerSourceLabel = "interactive selection";
      break;
  }

  logger.section("Creating a new Lattice app");
  logger.kv("Location", targetRoot);
  logger.kv("Template", template);
  logger.kv("Resolved package manager", resolvedPm.name);
  logger.kv("Package manager source", packageManagerSourceLabel);
  logger.kv("Git", gitEnabled ? "enabled" : "disabled (use --git to enable)");
  logger.kv("Lint/format", lintEnabled ? "enabled" : "disabled");

  logger.section("Resolving");
  const versionSpinner = logger.spinner("Resolving latest package versions...");
  const packagesToResolve = [
    ...Object.values(CORE_VERSION_PACKAGES),
    ...(lintEnabled ? Object.values(LINT_VERSION_PACKAGES) : []),
  ];
  const versions = await resolveLatestVersionsFn(packagesToResolve);
  versionSpinner.succeed("Package versions resolved.");

  const templateDir = path.resolve(__dirname, "../../templates/init");
  logger.section("Scaffolding");
  const scaffoldSpinner = logger.spinner(`Scaffolding ${template} template...`);
  const report = await copyTemplateSafe(templateDir, targetRoot, {
    dryRun: false,
    logger,
    replacements: {
      __PROJECT_NAME__: inferPackageName(targetRoot),
      __LATTICE_STYLE_VERSION__: versions[CORE_VERSION_PACKAGES.latticeStyle],
      __LATTICE_CLI_VERSION__: versions[CORE_VERSION_PACKAGES.latticeCli],
      __RBXTS_REACT_VERSION__: versions[CORE_VERSION_PACKAGES.rbxtsReact],
      __RBXTS_REACT_ROBLOX_VERSION__: versions[CORE_VERSION_PACKAGES.rbxtsReactRoblox],
      __RBXTS_COMPILER_TYPES_VERSION__: versions[CORE_VERSION_PACKAGES.rbxtsCompilerTypes],
      __RBXTS_TYPES_VERSION__: versions[CORE_VERSION_PACKAGES.rbxtsTypes],
      __ROBLOX_TS_VERSION__: versions[CORE_VERSION_PACKAGES.robloxTs],
      __TYPESCRIPT_VERSION__: versions[CORE_VERSION_PACKAGES.typescript],
    },
  });
  scaffoldSpinner.succeed(`Scaffold complete (${report.created.length} created, ${report.merged.length} merged).`);

  if (lintEnabled) {
    logger.section("Configuring");
    const lintTemplateDir = path.resolve(__dirname, "../../templates/init-lint");
    const lintSpinner = logger.spinner("Applying ESLint + Prettier configuration...");
    await copyTemplateSafe(lintTemplateDir, targetRoot, {
      dryRun: false,
      logger,
      replacements: {
        __ESLINT_VERSION__: versions[LINT_VERSION_PACKAGES.eslint],
        __ESLINT_ESLINTRC_VERSION__: versions[LINT_VERSION_PACKAGES.eslintEslintrc],
        __ESLINT_JS_VERSION__: versions[LINT_VERSION_PACKAGES.eslintJs],
        __ESLINT_CONFIG_PRETTIER_VERSION__: versions[LINT_VERSION_PACKAGES.eslintConfigPrettier],
        __ESLINT_PLUGIN_PRETTIER_VERSION__: versions[LINT_VERSION_PACKAGES.eslintPluginPrettier],
        __ESLINT_PLUGIN_ROBLOX_TS_VERSION__: versions[LINT_VERSION_PACKAGES.eslintPluginRobloxTs],
        __TYPESCRIPT_ESLINT_PLUGIN_VERSION__: versions[LINT_VERSION_PACKAGES.typescriptEslintPlugin],
        __TYPESCRIPT_ESLINT_PARSER_VERSION__: versions[LINT_VERSION_PACKAGES.typescriptEslintParser],
        __PRETTIER_VERSION__: versions[LINT_VERSION_PACKAGES.prettier],
      },
    });
    lintSpinner.succeed("Lint and format configuration applied.");
  }

  await ensureProjectDirectories(targetRoot);
  await ensureGitignoreExists(targetRoot);
  await ensurePnpmNodeLinkerConfig(targetRoot, resolvedPm.name);

  logger.section("Installing");
  const installSpinner = logger.spinner(`Installing dependencies with ${resolvedPm.name}...`);
  await resolvedPm.manager.install(targetRoot);
  installSpinner.succeed("Dependencies installed.");

  if (gitEnabled) {
    logger.section("Git");
    const gitSpinner = logger.spinner("Initializing git repository...");
    await runProcessFn("git", ["init"], targetRoot);
    gitSpinner.succeed("Git repository initialized.");
  }

  logger.success(`Success! Created ${path.basename(targetRoot)} at ${targetRoot}`);
  logger.kv("Files created", String(report.created.length));
  logger.kv("Files merged", String(report.merged.length));

  logger.section("Next Steps");
  logger.step(`cd ${relativeProjectPath}`);
  logger.step(`${resolvedPm.name} run build`);
  logger.step(`${resolveLocalLatticeCommand(resolvedPm.name)} add --preset form`);
}
