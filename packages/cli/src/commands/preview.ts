import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { usageError, validationError } from "../core/errors";
import { createPreviewAppFiles, ensureAppDirectoryIsEmpty, writePreviewAppFiles } from "./previewScaffold";
import {
  ensureUniqueTargetNames,
  type PreviewTargetSpec,
  parseTargetSpec,
  validatePreviewTargets,
} from "./previewShared";

type LegacyPreviewSubcommand = "init" | "generate";

type ParsedPreviewArgs =
  | {
      mode: "dev";
      packageName: string;
      packageRoot: string;
      sourceRoot: string;
    }
  | {
      mode: "help";
    }
  | {
      appDir: string;
      command: LegacyPreviewSubcommand;
      mode: "legacy";
      targets: PreviewTargetSpec[];
    };

type PreviewModule = {
  buildPreviewModules: (options: {
    outDir?: string;
    targets: Array<{ name: string; sourceRoot: string }>;
  }) => Promise<{ outDir: string; writtenFiles: string[] }>;
  startPreviewServer: (options: {
    packageName: string;
    packageRoot: string;
    port?: number;
    sourceRoot: string;
  }) => Promise<void>;
};

type PreviewModuleNamespace = PreviewModule & {
  default?: PreviewModule;
};

const PREVIEW_HELP_TEXT = `Lattice Preview

Usage:
  lattice preview
  lattice preview init --target <name=srcDir>... [--app-dir preview]
  lattice preview generate --target <name=srcDir>... [--app-dir preview]

Notes:
  Run \`lattice preview\` from a package root to preview that package's real src/**/*.tsx files in a web shell.
  \`init\` and \`generate\` remain available as legacy compatibility commands.

Examples:
  npx lattice preview
  npx lattice preview init --target checkbox=packages/checkbox/src --app-dir preview
  npx lattice preview generate --target checkbox=packages/checkbox/src --app-dir preview
`;

function canImportTypeScriptSource() {
  return path.extname(__filename) === ".ts" || process.execArgv.some((value) => value.includes("tsx"));
}

function isPreviewModule(value: unknown): value is PreviewModule {
  return (
    typeof value === "object" &&
    value !== null &&
    "buildPreviewModules" in value &&
    typeof value.buildPreviewModules === "function" &&
    "startPreviewServer" in value &&
    typeof value.startPreviewServer === "function"
  );
}

function normalizePreviewModule(module: unknown): PreviewModule {
  if (isPreviewModule(module)) {
    return module;
  }

  if (typeof module === "object" && module !== null && "default" in module) {
    const defaultExport = (module as PreviewModuleNamespace).default;
    if (isPreviewModule(defaultExport)) {
      return defaultExport;
    }
  }

  throw new Error("Unable to load a valid @lattice-ui/preview module.");
}

function loadPreviewModuleFromRequire(specifier: string): PreviewModule {
  return normalizePreviewModule(require(specifier));
}

async function loadPreviewModuleFromImport(specifier: string): Promise<PreviewModule> {
  const dynamicImport = new Function("specifier", "return import(specifier);") as (
    specifier: string,
  ) => Promise<unknown>;
  const importedModule = (await dynamicImport(specifier)) as PreviewModuleNamespace;
  return normalizePreviewModule(importedModule);
}

async function loadPreviewModule(): Promise<PreviewModule> {
  const localSourcePath = path.resolve(__dirname, "../../../preview/src/index.ts");
  if (canImportTypeScriptSource() && fs.existsSync(localSourcePath)) {
    return loadPreviewModuleFromImport(pathToFileURL(localSourcePath).href);
  }

  const localDistPath = path.resolve(__dirname, "../../../preview/dist/index.js");
  if (fs.existsSync(localDistPath)) {
    return loadPreviewModuleFromRequire(localDistPath);
  }

  const previewModuleId = "@lattice-ui/preview";
  return loadPreviewModuleFromRequire(previewModuleId);
}

function readPackageVersion(relativePackageJsonPath: string) {
  const packageJsonPath = path.resolve(__dirname, relativePackageJsonPath);
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as { version?: string };
  return packageJson.version ?? "latest";
}

function printPreviewHelp() {
  process.stdout.write(PREVIEW_HELP_TEXT);
}

export function resolvePreviewDevContext(cwd: string) {
  const packageRoot = path.resolve(cwd);
  const packageJsonPath = path.join(packageRoot, "package.json");
  const sourceRoot = path.join(packageRoot, "src");

  if (!fs.existsSync(packageJsonPath)) {
    throw validationError(`lattice preview must be run from a package root with package.json: ${packageRoot}`);
  }

  if (!fs.existsSync(sourceRoot) || !fs.statSync(sourceRoot).isDirectory()) {
    throw validationError(`Preview source directory does not exist: ${sourceRoot}`);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as { name?: string };

  return {
    packageName: packageJson.name ?? path.basename(packageRoot),
    packageRoot,
    sourceRoot,
  };
}

function parseLegacyArgs(commandToken: LegacyPreviewSubcommand, argv: string[], cwd: string): ParsedPreviewArgs {
  const targets: PreviewTargetSpec[] = [];
  let appDir = path.resolve(cwd, "preview");

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--help" || token === "-h") {
      return { mode: "help" };
    }

    if (token === "--app-dir") {
      const value = argv[index + 1];
      if (!value) {
        throw usageError("Missing value for --app-dir.");
      }
      appDir = path.resolve(cwd, value);
      index += 1;
      continue;
    }

    if (token.startsWith("--app-dir=")) {
      appDir = path.resolve(cwd, token.slice("--app-dir=".length));
      continue;
    }

    if (token === "--target") {
      const value = argv[index + 1];
      if (!value) {
        throw usageError("Missing value for --target.");
      }
      targets.push(parseTargetSpec(value, cwd));
      index += 1;
      continue;
    }

    if (token.startsWith("--target=")) {
      targets.push(parseTargetSpec(token.slice("--target=".length), cwd));
      continue;
    }

    throw usageError(`Unknown option for preview ${commandToken}: ${token}`);
  }

  if (targets.length === 0) {
    throw usageError("preview legacy commands require at least one --target <name=srcDir>.");
  }

  ensureUniqueTargetNames(targets);

  return {
    appDir,
    command: commandToken,
    mode: "legacy",
    targets,
  };
}

export function parsePreviewArgs(argv: string[], cwd = process.cwd()): ParsedPreviewArgs {
  if (argv.length === 0) {
    return {
      mode: "dev",
      ...resolvePreviewDevContext(cwd),
    };
  }

  const [first, ...rest] = argv;
  if (first === "--help" || first === "-h" || first === "help") {
    return { mode: "help" };
  }

  if (first === "init" || first === "generate") {
    return parseLegacyArgs(first, rest, cwd);
  }

  throw usageError(`Unknown preview command: ${first}`);
}

export async function runPreviewCommand(argv: string[], cwd = process.cwd()) {
  const parsed = parsePreviewArgs(argv, cwd);

  if (parsed.mode === "help") {
    printPreviewHelp();
    return;
  }

  if (parsed.mode === "dev") {
    const previewModule = await loadPreviewModule();
    await previewModule.startPreviewServer(parsed);
    return;
  }

  validatePreviewTargets(parsed.targets);

  if (parsed.command === "init") {
    ensureAppDirectoryIsEmpty(parsed.appDir);
    const cliVersion = readPackageVersion("../../package.json");
    const previewVersion = readPackageVersion("../../../preview/package.json");
    const files = createPreviewAppFiles({
      appDir: parsed.appDir,
      cliVersion,
      previewVersion,
      targets: parsed.targets,
    });
    writePreviewAppFiles(parsed.appDir, files);
    process.stdout.write(`Created preview app in ${parsed.appDir}.\n`);
    return;
  }

  const previewModule = await loadPreviewModule();
  const result = await previewModule.buildPreviewModules({
    outDir: path.join(parsed.appDir, "src", "generated"),
    targets: parsed.targets,
  });
  process.stdout.write(`Generated ${result.writtenFiles.length} preview file(s) into ${result.outDir}.\n`);
}
