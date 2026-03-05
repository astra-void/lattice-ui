import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { packageManagerFailedError, usageError } from "../core/errors";
import { copyTemplateSafe } from "../core/fs/copy";
import { createLogger } from "../core/logger";
import { resolveLatestVersions } from "../core/npm/latest";
import { detectPackageManager } from "../core/pm/detect";
import type { PackageManagerName } from "../core/pm/types";
import { type PromptRuntime, promptConfirm, promptSelect } from "../core/prompt";

export interface CreateCommandInput {
  cwd: string;
  projectPath: string;
  pm?: string;
  yes: boolean;
  git?: boolean;
  template?: string;
}

interface CreateCommandRuntimeOverrides {
  detectPackageManagerFn?: typeof detectPackageManager;
  resolveLatestVersionsFn?: typeof resolveLatestVersions;
  runProcessFn?: (command: string, args: string[], cwd: string) => Promise<void>;
}

const SUPPORTED_TEMPLATE = "rbxts";

const VERSION_PACKAGES = {
  latticeStyle: "@lattice-ui/style",
  rbxtsReact: "@rbxts/react",
  rbxtsReactRoblox: "@rbxts/react-roblox",
  rbxtsCompilerTypes: "@rbxts/compiler-types",
  rbxtsTypes: "@rbxts/types",
  robloxTs: "roblox-ts",
  typescript: "typescript",
} as const;

const GITIGNORE_CONTENT = "node_modules\nout\n";

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

async function selectTemplate(runtime: PromptRuntime, providedTemplate: string | undefined): Promise<string> {
  const normalized = normalizeTemplate(providedTemplate);

  if (normalized !== SUPPORTED_TEMPLATE) {
    throw usageError(`Unknown template: ${normalized}. Supported template: ${SUPPORTED_TEMPLATE}.`);
  }

  if (providedTemplate) {
    return normalized;
  }

  return promptSelect(runtime, "Select a template", [{ label: "rbxts", value: SUPPORTED_TEMPLATE }], {
    defaultIndex: 0,
  });
}

async function selectPackageManager(
  runtime: PromptRuntime,
  providedPm: string | undefined,
): Promise<PackageManagerName> {
  const normalized = normalizePackageManager(providedPm);
  if (normalized) {
    return normalized;
  }

  return promptSelect(
    runtime,
    "Select a package manager",
    [
      { label: "npm", value: "npm" as const },
      { label: "pnpm", value: "pnpm" as const },
      { label: "yarn", value: "yarn" as const },
    ],
    { defaultIndex: 0 },
  );
}

async function selectGitEnabled(runtime: PromptRuntime, providedGit: boolean | undefined): Promise<boolean> {
  if (providedGit !== undefined) {
    return providedGit;
  }

  return promptConfirm(runtime, "Initialize a git repository?", { defaultValue: false });
}

export async function runCreateCommand(
  input: CreateCommandInput,
  runtimeOverrides?: CreateCommandRuntimeOverrides,
): Promise<void> {
  const detectPackageManagerFn = runtimeOverrides?.detectPackageManagerFn ?? detectPackageManager;
  const resolveLatestVersionsFn = runtimeOverrides?.resolveLatestVersionsFn ?? resolveLatestVersions;
  const runProcessFn = runtimeOverrides?.runProcessFn ?? runProcess;

  const runtime: PromptRuntime = { yes: input.yes };

  const template = await selectTemplate(runtime, input.template);
  if (template !== SUPPORTED_TEMPLATE) {
    throw usageError(`Unsupported template: ${template}`);
  }

  const packageManager = await selectPackageManager(runtime, input.pm);
  const gitEnabled = await selectGitEnabled(runtime, input.git);

  const relativeProjectPath = normalizeProjectPath(input.projectPath);
  const targetRoot = path.resolve(input.cwd, relativeProjectPath);

  await ensureEmptyDirectory(targetRoot);

  const logger = createLogger({
    verbose: false,
    yes: input.yes,
  });

  const resolvedPm = await detectPackageManagerFn(targetRoot, packageManager);

  const versionSpinner = logger.spinner("Resolving latest package versions...");
  const versions = await resolveLatestVersionsFn(Object.values(VERSION_PACKAGES));
  versionSpinner.succeed("Latest package versions resolved.");

  const templateDir = path.resolve(__dirname, "../../templates/init");
  const scaffoldSpinner = logger.spinner(`Scaffolding ${template} template...`);
  const report = await copyTemplateSafe(templateDir, targetRoot, {
    dryRun: false,
    logger,
    replacements: {
      __PROJECT_NAME__: inferPackageName(targetRoot),
      __LATTICE_STYLE_VERSION__: versions[VERSION_PACKAGES.latticeStyle],
      __RBXTS_REACT_VERSION__: versions[VERSION_PACKAGES.rbxtsReact],
      __RBXTS_REACT_ROBLOX_VERSION__: versions[VERSION_PACKAGES.rbxtsReactRoblox],
      __RBXTS_COMPILER_TYPES_VERSION__: versions[VERSION_PACKAGES.rbxtsCompilerTypes],
      __RBXTS_TYPES_VERSION__: versions[VERSION_PACKAGES.rbxtsTypes],
      __ROBLOX_TS_VERSION__: versions[VERSION_PACKAGES.robloxTs],
      __TYPESCRIPT_VERSION__: versions[VERSION_PACKAGES.typescript],
    },
  });
  scaffoldSpinner.succeed(
    `Template scaffold complete (created=${report.created.length}, merged=${report.merged.length}, skipped=${report.skipped.length}).`,
  );

  const installSpinner = logger.spinner(`Installing dependencies with ${resolvedPm.name}...`);
  await resolvedPm.manager.install(targetRoot);
  installSpinner.succeed("Dependencies installed.");

  if (gitEnabled) {
    const gitSpinner = logger.spinner("Initializing git repository...");
    await runProcessFn("git", ["init"], targetRoot);
    await fs.writeFile(path.join(targetRoot, ".gitignore"), GITIGNORE_CONTENT, "utf8");
    gitSpinner.succeed("Git repository initialized.");
  }

  logger.success(`Project created at ${targetRoot}`);
  logger.info("Next steps:");
  logger.info(`  cd ${relativeProjectPath}`);
  logger.info(`  ${resolvedPm.name} run build`);
}
