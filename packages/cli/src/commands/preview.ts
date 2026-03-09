import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { usageError, validationError } from "../core/errors";

type ParsedPreviewArgs =
  | {
      configFile?: string;
      headless: boolean;
      mode: "run";
    }
  | {
      mode: "help";
    };

type PreviewModule = {
  createPreviewHeadlessSession: (options?: {
    configFile?: string;
    cwd?: string;
  }) => Promise<{
    dispose(): void;
    getSnapshot(): unknown;
  }>;
  startPreviewServer: (options?: {
    configFile?: string;
    cwd?: string;
    packageName?: string;
    packageRoot?: string;
    port?: number;
    runtimeModule?: string;
    sourceRoot?: string;
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
  lattice preview [--config <path>] [--headless]

Notes:
  Run \`lattice preview\` from a package root for zero-config preview, or add \`lattice.preview.config.ts\` to drive workspace preview.
  \`--headless\` prints the resolved preview snapshot as JSON and exits.

Examples:
  npx lattice preview
  npx lattice preview --config ./lattice.preview.config.ts
  npx lattice preview --headless
`;

function canImportTypeScriptSource() {
  return path.extname(__filename) === ".ts" || process.execArgv.some((value) => value.includes("tsx"));
}

function isPreviewModule(value: unknown): value is PreviewModule {
  return (
    typeof value === "object" &&
    value !== null &&
    "startPreviewServer" in value &&
    typeof value.startPreviewServer === "function" &&
    "createPreviewHeadlessSession" in value &&
    typeof value.createPreviewHeadlessSession === "function"
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

  return loadPreviewModuleFromImport("@lattice-ui/preview");
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

export function parsePreviewArgs(argv: string[]): ParsedPreviewArgs {
  if (argv.length === 0) {
    return {
      headless: false,
      mode: "run",
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

  let configFile: string | undefined;
  let headless = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--headless") {
      headless = true;
      continue;
    }

    if (token === "--config") {
      const value = argv[index + 1];
      if (!value) {
        throw usageError("Missing value for --config.");
      }
      configFile = value;
      index += 1;
      continue;
    }

    if (token.startsWith("--config=")) {
      configFile = token.slice("--config=".length);
      continue;
    }

    if (token.startsWith("-")) {
      throw usageError(`Unknown preview option: ${token}`);
    }

    throw usageError(`Unknown preview command: ${token}`);
  }

  return {
    configFile,
    headless,
    mode: "run",
  };
}

export async function runPreviewCommand(argv: string[], cwd = process.cwd()) {
  const parsed = parsePreviewArgs(argv);

  if (parsed.mode === "help") {
    printPreviewHelp();
    return;
  }

  const previewModule = await loadPreviewModule();
  if (parsed.headless) {
    const session = await previewModule.createPreviewHeadlessSession({
      configFile: parsed.configFile ? path.resolve(cwd, parsed.configFile) : undefined,
      cwd,
    });
    try {
      process.stdout.write(`${JSON.stringify(session.getSnapshot(), null, 2)}\n`);
    } finally {
      session.dispose();
    }
    return;
  }

  await previewModule.startPreviewServer({
    configFile: parsed.configFile ? path.resolve(cwd, parsed.configFile) : undefined,
    cwd,
  });
}
