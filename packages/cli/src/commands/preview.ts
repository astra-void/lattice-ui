import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { usageError, validationError } from "../core/errors";

type ParsedPreviewArgs =
  | {
      mode: "dev";
      packageName: string;
      packageRoot: string;
      sourceRoot: string;
      transformMode: "compatibility";
    }
  | {
      mode: "help";
    };

type PreviewModule = {
  startPreviewServer: (options: {
    packageName: string;
    packageRoot: string;
    port?: number;
    sourceRoot: string;
    transformMode?: "strict-fidelity" | "compatibility" | "mocked" | "design-time";
  }) => Promise<void>;
};

type PreviewModuleNamespace = PreviewModule & {
  default?: PreviewModule;
};

const dynamicImport = new Function("specifier", "return import(specifier);") as (
  specifier: string,
) => Promise<PreviewModuleNamespace>;

const PREVIEW_HELP_TEXT = `Lattice Preview

Usage:
  lattice preview

Notes:
  Run \`lattice preview\` from a package root to preview that package's real src/**/*.tsx files in a web shell.
  Source-first preview is the only supported workflow.

Examples:
  npx lattice preview
`;

function canImportTypeScriptSource() {
  return path.extname(__filename) === ".ts" || process.execArgv.some((value) => value.includes("tsx"));
}

function isPreviewModule(value: unknown): value is PreviewModule {
  return (
    typeof value === "object" &&
    value !== null &&
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

async function loadPreviewModuleFromImport(specifier: string): Promise<PreviewModule> {
  const importedModule = await dynamicImport(specifier);
  return normalizePreviewModule(importedModule);
}

async function loadPreviewModule(): Promise<PreviewModule> {
  const localSourcePath = path.resolve(__dirname, "../../../preview/src/index.ts");
  if (canImportTypeScriptSource() && fs.existsSync(localSourcePath)) {
    return loadPreviewModuleFromImport(pathToFileURL(localSourcePath).href);
  }

  const localDistPath = path.resolve(__dirname, "../../../preview/dist/index.mjs");
  if (fs.existsSync(localDistPath)) {
    return loadPreviewModuleFromImport(pathToFileURL(localDistPath).href);
  }

  const previewModuleId = "@lattice-ui/preview";
  return loadPreviewModuleFromImport(previewModuleId);
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
  const packageName = packageJson.name ?? path.basename(packageRoot);

  return {
    packageName,
    packageRoot,
    sourceRoot,
    transformMode: "compatibility" as const,
  };
}

function removedPreviewSubcommandError(command: "generate" | "init") {
  return validationError(
    `lattice preview ${command} was removed. Source-first preview replaced legacy scaffolding. Run \`lattice preview\` from the package root instead.`,
  );
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
    if (rest.includes("--help") || rest.includes("-h")) {
      throw removedPreviewSubcommandError(first);
    }

    throw removedPreviewSubcommandError(first);
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
  }
}
