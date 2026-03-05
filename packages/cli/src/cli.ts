import { promises as fs } from "node:fs";
import * as path from "node:path";
import { runAddCommand } from "./commands/add";
import { runDoctorCommand } from "./commands/doctor";
import { runInitCommand } from "./commands/init";
import { runUpgradeCommand } from "./commands/upgrade";
import { usageError } from "./core/errors";
import { createContext, type GlobalOptions } from "./ctx";

const HELP_TEXT = `Usage: lattice <command> [options]

Commands:
  init
  add <name...> [--preset <preset...>]
  upgrade [name...] [--preset <preset...>]
  doctor

Global options:
  --cwd <path>
  --pm <pnpm|npm|yarn>
  --verbose
  --dry-run
  --yes
  --help
  --version
`;

interface ParsedCli {
  options: GlobalOptions;
  command?: string;
  commandArgs: string[];
  showHelp: boolean;
  showVersion: boolean;
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function parseGlobal(argv: string[]): ParsedCli {
  const options: GlobalOptions = {
    cwd: process.cwd(),
    pm: undefined,
    verbose: false,
    dryRun: false,
    yes: false,
  };

  const passthrough: string[] = [];
  let showHelp = false;
  let showVersion = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--cwd") {
      const value = argv[index + 1];
      if (!value) {
        throw usageError("Missing value for --cwd.");
      }

      options.cwd = value;
      index += 1;
      continue;
    }

    if (token.startsWith("--cwd=")) {
      options.cwd = token.slice("--cwd=".length);
      continue;
    }

    if (token === "--pm") {
      const value = argv[index + 1];
      if (!value) {
        throw usageError("Missing value for --pm.");
      }

      options.pm = value;
      index += 1;
      continue;
    }

    if (token.startsWith("--pm=")) {
      options.pm = token.slice("--pm=".length);
      continue;
    }

    if (token === "--verbose") {
      options.verbose = true;
      continue;
    }

    if (token === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (token === "--yes") {
      options.yes = true;
      continue;
    }

    if (token === "--help" || token === "-h") {
      showHelp = true;
      continue;
    }

    if (token === "--version" || token === "-v") {
      showVersion = true;
      continue;
    }

    passthrough.push(token);
  }

  return {
    options,
    command: passthrough[0],
    commandArgs: passthrough.slice(1),
    showHelp,
    showVersion,
  };
}

function parseSelectionArgs(args: string[]): { names: string[]; presets: string[] } {
  const names: string[] = [];
  const presets: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];

    if (token === "--preset") {
      const value = args[index + 1];
      if (!value) {
        throw usageError("Missing value for --preset.");
      }

      presets.push(...splitList(value));
      index += 1;
      continue;
    }

    if (token.startsWith("--preset=")) {
      presets.push(...splitList(token.slice("--preset=".length)));
      continue;
    }

    if (token.startsWith("-")) {
      throw usageError(`Unknown option: ${token}`);
    }

    names.push(...splitList(token));
  }

  return { names, presets };
}

async function readCliVersion(): Promise<string> {
  const packageJsonPath = path.resolve(__dirname, "../package.json");
  const content = await fs.readFile(packageJsonPath, "utf8");
  const parsed = JSON.parse(content) as { version?: string };
  return parsed.version ?? "0.0.0";
}

function printHelp() {
  process.stdout.write(HELP_TEXT);
}

export async function runCli(argv: string[]): Promise<void> {
  const parsed = parseGlobal(argv);

  if (parsed.showVersion && !parsed.command) {
    process.stdout.write(`${await readCliVersion()}\n`);
    return;
  }

  if (parsed.showHelp || !parsed.command || parsed.command === "help") {
    printHelp();
    return;
  }

  if (parsed.command === "init") {
    if (parsed.commandArgs.length > 0) {
      throw usageError("init does not accept positional arguments.");
    }

    const ctx = await createContext(parsed.options, { allowMissingProject: true });
    await runInitCommand(ctx);
    return;
  }

  if (parsed.command === "add") {
    const selection = parseSelectionArgs(parsed.commandArgs);
    const ctx = await createContext(parsed.options);
    await runAddCommand(ctx, selection);
    return;
  }

  if (parsed.command === "upgrade") {
    const selection = parseSelectionArgs(parsed.commandArgs);
    const ctx = await createContext(parsed.options);
    await runUpgradeCommand(ctx, selection);
    return;
  }

  if (parsed.command === "doctor") {
    if (parsed.commandArgs.length > 0) {
      throw usageError("doctor does not accept positional arguments.");
    }

    const ctx = await createContext(parsed.options);
    await runDoctorCommand(ctx);
    return;
  }

  throw usageError(`Unknown command: ${parsed.command}`);
}
