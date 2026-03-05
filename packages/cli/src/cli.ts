import { promises as fs } from "node:fs";
import * as path from "node:path";
import { runAddCommand } from "./commands/add";
import { runCreateCommand } from "./commands/create";
import { runDoctorCommand } from "./commands/doctor";
import { runUpgradeCommand } from "./commands/upgrade";
import { usageError } from "./core/errors";
import { createContext } from "./ctx";

const HELP_TEXT = `Usage: lattice <command> [options]

Commands:
  create <project-path> [--yes] [--pm <pnpm|npm|yarn>] [--git] [--template rbxts]
  add [name...] [--preset <preset...>] [--yes] [--dry-run]
  upgrade [name...] [--preset <preset...>] [--yes] [--dry-run]
  doctor
  help
  version

Global options:
  --help
  --version
`;

interface ParsedCommandLine {
  command?: string;
  commandArgs: string[];
  showHelp: boolean;
  showVersion: boolean;
}

interface ParsedCreateArgs {
  projectPath: string;
  yes: boolean;
  pm?: string;
  git?: boolean;
  template?: string;
}

interface ParsedSelectionArgs {
  names: string[];
  presets: string[];
  yes: boolean;
  dryRun: boolean;
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function parseTopLevel(argv: string[]): ParsedCommandLine {
  if (argv.length === 0) {
    return {
      showHelp: true,
      showVersion: false,
      commandArgs: [],
    };
  }

  const first = argv[0];
  if (first === "--help" || first === "-h" || first === "help") {
    return {
      showHelp: true,
      showVersion: false,
      commandArgs: [],
    };
  }

  if (first === "--version" || first === "-v" || first === "version") {
    return {
      showHelp: false,
      showVersion: true,
      commandArgs: [],
    };
  }

  if (first.startsWith("-")) {
    throw usageError(`Unknown global option: ${first}`);
  }

  return {
    command: first,
    commandArgs: argv.slice(1),
    showHelp: false,
    showVersion: false,
  };
}

function parseCreateArgs(args: string[]): ParsedCreateArgs {
  const positionals: string[] = [];
  let yes = false;
  let pm: string | undefined;
  let git: boolean | undefined;
  let template: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];

    if (token === "--yes") {
      yes = true;
      continue;
    }

    if (token === "--pm") {
      const value = args[index + 1];
      if (!value) {
        throw usageError("Missing value for --pm.");
      }
      pm = value;
      index += 1;
      continue;
    }

    if (token.startsWith("--pm=")) {
      pm = token.slice("--pm=".length);
      continue;
    }

    if (token === "--git") {
      git = true;
      continue;
    }

    if (token === "--template") {
      const value = args[index + 1];
      if (!value) {
        throw usageError("Missing value for --template.");
      }
      template = value;
      index += 1;
      continue;
    }

    if (token.startsWith("--template=")) {
      template = token.slice("--template=".length);
      continue;
    }

    if (token.startsWith("-")) {
      throw usageError(`Unknown option for create: ${token}`);
    }

    positionals.push(token);
  }

  if (positionals.length !== 1) {
    throw usageError("create requires exactly one <project-path> argument.");
  }

  return {
    projectPath: positionals[0],
    yes,
    pm,
    git,
    template,
  };
}

function parseSelectionArgs(args: string[], command: "add" | "upgrade"): ParsedSelectionArgs {
  const names: string[] = [];
  const presets: string[] = [];
  let yes = false;
  let dryRun = false;

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

    if (token === "--yes") {
      yes = true;
      continue;
    }

    if (token === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (token.startsWith("-")) {
      throw usageError(`Unknown option for ${command}: ${token}`);
    }

    names.push(...splitList(token));
  }

  return {
    names,
    presets,
    yes,
    dryRun,
  };
}

function parseDoctorArgs(args: string[]) {
  if (args.length > 0) {
    throw usageError("doctor does not accept positional arguments or flags.");
  }
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
  const parsed = parseTopLevel(argv);

  if (parsed.showVersion) {
    process.stdout.write(`${await readCliVersion()}\n`);
    return;
  }

  if (parsed.showHelp || !parsed.command) {
    printHelp();
    return;
  }

  if (parsed.command === "init") {
    throw usageError("The init command has been removed. Use: lattice create <project-path>");
  }

  if (parsed.command === "create") {
    const createArgs = parseCreateArgs(parsed.commandArgs);
    await runCreateCommand({
      cwd: process.cwd(),
      ...createArgs,
    });
    return;
  }

  if (parsed.command === "add") {
    const selection = parseSelectionArgs(parsed.commandArgs, "add");
    const ctx = await createContext({
      cwd: process.cwd(),
      pm: undefined,
      dryRun: selection.dryRun,
      yes: selection.yes,
      verbose: false,
    });
    await runAddCommand(ctx, { names: selection.names, presets: selection.presets });
    return;
  }

  if (parsed.command === "upgrade") {
    const selection = parseSelectionArgs(parsed.commandArgs, "upgrade");
    const ctx = await createContext({
      cwd: process.cwd(),
      pm: undefined,
      dryRun: selection.dryRun,
      yes: selection.yes,
      verbose: false,
    });
    await runUpgradeCommand(ctx, { names: selection.names, presets: selection.presets });
    return;
  }

  if (parsed.command === "doctor") {
    parseDoctorArgs(parsed.commandArgs);
    const ctx = await createContext({
      cwd: process.cwd(),
      pm: undefined,
      dryRun: false,
      yes: false,
      verbose: false,
    });
    await runDoctorCommand(ctx);
    return;
  }

  throw usageError(`Unknown command: ${parsed.command}`);
}
