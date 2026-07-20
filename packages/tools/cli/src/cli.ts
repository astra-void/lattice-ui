import { promises as fs } from "node:fs";
import * as path from "node:path";
import { runAddCommand } from "./commands/add";
import { runCreateCommand } from "./commands/create";
import { runDoctorCommand } from "./commands/doctor";
import { runInitCommand } from "./commands/init";
import { runRemoveCommand } from "./commands/remove";
import { resolveComponentSelection } from "./commands/selection";
import { runUpgradeCommand } from "./commands/upgrade";
import { usageError } from "./core/errors";
import { loadRegistry } from "./core/registry/load";
import type { Registry } from "./core/registry/schema";
import { didYouMean } from "./core/suggest";
import { createContext } from "./ctx";

interface CommandSpec {
  name: string;
  summary: string;
  usage: string;
  options: [flag: string, description: string][];
  examples: string[];
  /** Rendered under the options block; used to list registry contents. */
  extra?: (registry: Registry) => string[];
}

const GLOBAL_OPTIONS: [string, string][] = [
  ["-h, --help", "Show help for the CLI or a command."],
  ["-v, --version", "Print the CLI version."],
  ["    --verbose", "Print debug-level progress output."],
];

const PM_OPTION: [string, string] = ["    --pm <pnpm|npm|yarn>", "Force a package manager instead of detecting one."];
const YES_OPTION: [string, string] = ["-y, --yes", "Skip prompts and accept the default answer for each."];
const DRY_RUN_OPTION: [string, string] = ["    --dry-run", "Show what would happen without touching the project."];

function listRegistryNames(registry: Registry): string[] {
  const components = Object.keys(registry.packages).sort((left, right) => left.localeCompare(right));
  const presets = Object.keys(registry.presets).sort((left, right) => left.localeCompare(right));

  return [
    "Components:",
    ...wrapNames(components),
    "",
    "Presets:",
    ...presets.map((preset) => `  ${preset} (${registry.presets[preset].join(", ")})`),
  ];
}

/** Packs names into ~76-column rows so long registries do not scroll a terminal off-screen. */
function wrapNames(names: string[]): string[] {
  const rows: string[] = [];
  let current = "";

  for (const name of names) {
    const next = current.length === 0 ? `  ${name}` : `${current}, ${name}`;
    if (next.length > 76) {
      rows.push(current);
      current = `  ${name}`;
      continue;
    }
    current = next;
  }

  if (current.length > 0) {
    rows.push(current);
  }

  return rows;
}

const COMMANDS: CommandSpec[] = [
  {
    name: "create",
    summary: "Create a new project from a Lattice template.",
    usage: "lattice create [project-path] [options]",
    options: [
      YES_OPTION,
      PM_OPTION,
      ["    --git", "Initialize a git repository in the new project."],
      ["    --template <rbxts>", "Template to scaffold from. Defaults to rbxts."],
      ["    --lint / --no-lint", "Force ESLint + Prettier setup on or off."],
    ],
    examples: ["lattice create", "lattice create my-game --pm npm --git --no-lint", "lattice create my-game --yes"],
  },
  {
    name: "init",
    summary: "Initialize Lattice in an existing project.",
    usage: "lattice init [options]",
    options: [
      YES_OPTION,
      DRY_RUN_OPTION,
      PM_OPTION,
      ["    --template <rbxts>", "Template to initialize from. Defaults to rbxts."],
      ["    --lint", "Also set up ESLint + Prettier."],
    ],
    examples: ["lattice init", "lattice init --dry-run", "lattice init --yes --pm pnpm --lint"],
  },
  {
    name: "add",
    summary: "Install component packages and their required peers.",
    usage: "lattice add [name...] [options]",
    options: [
      ["    --preset <preset...>", "Add every component in a preset. Comma-separated."],
      YES_OPTION,
      DRY_RUN_OPTION,
      PM_OPTION,
    ],
    examples: ["lattice add", "lattice add dialog toast", "lattice add dialog,toast --preset overlay --dry-run"],
    extra: listRegistryNames,
  },
  {
    name: "remove",
    summary: "Remove selected component packages.",
    usage: "lattice remove [name...] [options]",
    options: [
      ["    --preset <preset...>", "Remove every component in a preset. Comma-separated."],
      YES_OPTION,
      DRY_RUN_OPTION,
      PM_OPTION,
    ],
    examples: ["lattice remove dialog", "lattice remove --preset overlay --dry-run"],
    extra: listRegistryNames,
  },
  {
    name: "upgrade",
    summary: "Upgrade installed @lattice-ui/* packages.",
    usage: "lattice upgrade [name...] [options]",
    options: [
      ["    --preset <preset...>", "Limit the upgrade to a preset. Comma-separated."],
      YES_OPTION,
      DRY_RUN_OPTION,
      PM_OPTION,
    ],
    examples: ["lattice upgrade", "lattice upgrade --dry-run", "lattice upgrade dialog --yes"],
    extra: listRegistryNames,
  },
  {
    name: "doctor",
    summary: "Check lockfiles, peers, and provider expectations.",
    usage: "lattice doctor [options]",
    options: [PM_OPTION],
    examples: ["lattice doctor", "lattice doctor --pm pnpm"],
  },
];

const COMMAND_NAMES = COMMANDS.map((command) => command.name);

function findCommand(name: string): CommandSpec | undefined {
  return COMMANDS.find((command) => command.name === name);
}

function renderOptionRows(rows: [string, string][]): string[] {
  const width = Math.max(...rows.map(([flag]) => flag.length));
  return rows.map(([flag, description]) => `  ${flag.padEnd(width)}  ${description}`);
}

function renderRootHelp(): string {
  const summaryWidth = Math.max(...COMMAND_NAMES.map((name) => name.length));

  return [
    "Lattice CLI — unstyled UI primitives for roblox-ts.",
    "",
    "Usage:",
    "  lattice <command> [options]",
    "",
    "Commands:",
    ...COMMANDS.map((command) => `  ${command.name.padEnd(summaryWidth)}  ${command.summary}`),
    "",
    "Global options:",
    ...renderOptionRows(GLOBAL_OPTIONS),
    "",
    "Examples:",
    "  npx lattice-ui create",
    "  npx lattice-ui create my-game --pm npm --git --no-lint",
    "  npx lattice-ui init --dry-run",
    "  npx lattice-ui add dialog,toast --preset overlay",
    "  npx lattice-ui remove dialog --dry-run",
    "  npx lattice-ui upgrade --dry-run",
    "  npx lattice-ui doctor",
    "",
    "Run `lattice <command> --help` for command-specific options.",
    "",
  ].join("\n");
}

function renderCommandHelp(command: CommandSpec, registry?: Registry): string {
  const lines = [
    command.summary,
    "",
    "Usage:",
    `  ${command.usage}`,
    "",
    "Options:",
    ...renderOptionRows([...command.options, ...GLOBAL_OPTIONS.slice(0, 1)]),
  ];

  if (command.extra && registry) {
    lines.push("", ...command.extra(registry));
  }

  lines.push("", "Examples:", ...command.examples.map((example) => `  ${example}`), "");

  return lines.join("\n");
}

interface ParsedCommandLine {
  command?: string;
  commandArgs: string[];
  showHelp: boolean;
  showVersion: boolean;
}

interface ParsedCreateArgs {
  projectPath?: string;
  yes: boolean;
  pm?: string;
  git?: boolean;
  template?: string;
  lint?: boolean;
  verbose: boolean;
}

interface ParsedSelectionArgs {
  names: string[];
  presets: string[];
  pm?: string;
  yes: boolean;
  dryRun: boolean;
  verbose: boolean;
}

interface ParsedInitArgs {
  yes: boolean;
  dryRun: boolean;
  pm?: string;
  template?: string;
  lint?: boolean;
  verbose: boolean;
}

interface ParsedDoctorArgs {
  pm?: string;
  verbose: boolean;
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function isHelpFlag(token: string): boolean {
  return token === "--help" || token === "-h";
}

/** `--pm value` and `--pm=value` both land here; returns the value and how far to advance. */
function readOptionValue(args: string[], index: number, flag: string): { value: string; nextIndex: number } {
  const token = args[index];
  const inlinePrefix = `${flag}=`;

  if (token.startsWith(inlinePrefix)) {
    const value = token.slice(inlinePrefix.length);
    if (value.length === 0) {
      throw usageError(`Missing value for ${flag}.`);
    }
    return { value, nextIndex: index };
  }

  const value = args[index + 1];
  if (!value) {
    throw usageError(`Missing value for ${flag}.`);
  }

  return { value, nextIndex: index + 1 };
}

function unknownOptionError(command: string, token: string): never {
  const known = [
    ...(findCommand(command)?.options ?? []).flatMap(([flag]) =>
      flag.split(",").map((part) => part.trim().split(" ")[0]),
    ),
    "--help",
    "--verbose",
  ].filter((flag) => flag.startsWith("--"));

  throw usageError(
    `Unknown option for ${command}: ${token}`,
    didYouMean(token, known),
    `Run \`lattice ${command} --help\` to see the supported options.`,
  );
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
  if (isHelpFlag(first) || first === "help") {
    return {
      showHelp: true,
      showVersion: false,
      // `lattice help add` is the same request as `lattice add --help`.
      commandArgs: argv.slice(1),
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
    throw usageError(`Unknown global option: ${first}`, "Run `lattice --help` to see the supported options.");
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
  let verbose = false;
  let pm: string | undefined;
  let git: boolean | undefined;
  let template: string | undefined;
  let lint: boolean | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];

    if (token === "--yes" || token === "-y") {
      yes = true;
      continue;
    }

    if (token === "--verbose") {
      verbose = true;
      continue;
    }

    if (token === "--pm" || token.startsWith("--pm=")) {
      const read = readOptionValue(args, index, "--pm");
      pm = read.value;
      index = read.nextIndex;
      continue;
    }

    if (token === "--git") {
      git = true;
      continue;
    }

    if (token === "--lint") {
      if (lint === false) {
        throw usageError("Cannot use --lint and --no-lint together.");
      }
      lint = true;
      continue;
    }

    if (token === "--no-lint") {
      if (lint === true) {
        throw usageError("Cannot use --lint and --no-lint together.");
      }
      lint = false;
      continue;
    }

    if (token === "--template" || token.startsWith("--template=")) {
      const read = readOptionValue(args, index, "--template");
      template = read.value;
      index = read.nextIndex;
      continue;
    }

    if (token.startsWith("-")) {
      unknownOptionError("create", token);
    }

    positionals.push(token);
  }

  if (positionals.length > 1) {
    throw usageError(
      "create accepts at most one [project-path] argument.",
      `Received: ${positionals.join(", ")}`,
      "Quote the path if it contains spaces.",
    );
  }

  return {
    projectPath: positionals[0],
    yes,
    pm,
    git,
    template,
    lint,
    verbose,
  };
}

function parseInitArgs(args: string[]): ParsedInitArgs {
  let yes = false;
  let dryRun = false;
  let verbose = false;
  let pm: string | undefined;
  let template: string | undefined;
  let lint: boolean | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];

    if (token === "--yes" || token === "-y") {
      yes = true;
      continue;
    }

    if (token === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (token === "--verbose") {
      verbose = true;
      continue;
    }

    if (token === "--pm" || token.startsWith("--pm=")) {
      const read = readOptionValue(args, index, "--pm");
      pm = read.value;
      index = read.nextIndex;
      continue;
    }

    if (token === "--template" || token.startsWith("--template=")) {
      const read = readOptionValue(args, index, "--template");
      template = read.value;
      index = read.nextIndex;
      continue;
    }

    if (token === "--lint") {
      lint = true;
      continue;
    }

    if (token.startsWith("-")) {
      unknownOptionError("init", token);
    }

    throw usageError(
      "init does not accept positional arguments.",
      `Received: ${token}`,
      "Use `lattice create <project-path>` to scaffold a new project instead.",
    );
  }

  return {
    yes,
    dryRun,
    pm,
    template,
    lint,
    verbose,
  };
}

function parseSelectionArgs(args: string[], command: "add" | "remove" | "upgrade"): ParsedSelectionArgs {
  const names: string[] = [];
  const presets: string[] = [];
  let pm: string | undefined;
  let yes = false;
  let dryRun = false;
  let verbose = false;

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];

    if (token === "--preset" || token.startsWith("--preset=")) {
      const read = readOptionValue(args, index, "--preset");
      presets.push(...splitList(read.value));
      index = read.nextIndex;
      continue;
    }

    if (token === "--pm" || token.startsWith("--pm=")) {
      const read = readOptionValue(args, index, "--pm");
      pm = read.value;
      index = read.nextIndex;
      continue;
    }

    if (token === "--yes" || token === "-y") {
      yes = true;
      continue;
    }

    if (token === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (token === "--verbose") {
      verbose = true;
      continue;
    }

    if (token.startsWith("-")) {
      unknownOptionError(command, token);
    }

    names.push(...splitList(token));
  }

  return {
    names,
    presets,
    pm,
    yes,
    dryRun,
    verbose,
  };
}

function parseDoctorArgs(args: string[]): ParsedDoctorArgs {
  let pm: string | undefined;
  let verbose = false;

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];

    if (token === "--pm" || token.startsWith("--pm=")) {
      const read = readOptionValue(args, index, "--pm");
      pm = read.value;
      index = read.nextIndex;
      continue;
    }

    if (token === "--verbose") {
      verbose = true;
      continue;
    }

    if (token.startsWith("-")) {
      unknownOptionError("doctor", token);
    }

    throw usageError(
      "doctor does not accept positional arguments.",
      `Received: ${token}`,
      "Run `lattice doctor` from inside the project you want to check.",
    );
  }

  return { pm, verbose };
}

async function readCliVersion(): Promise<string> {
  const packageJsonPath = path.resolve(__dirname, "../package.json");
  const content = await fs.readFile(packageJsonPath, "utf8");
  const parsed = JSON.parse(content) as { version?: string };
  return parsed.version ?? "0.0.0";
}

/**
 * Renders help for `lattice help <command>`, `lattice <command> --help`, and the bare CLI.
 *
 * The registry is only loaded for commands that list components, so `--help` stays usable when the
 * registry file is unreadable.
 */
async function printHelp(commandName?: string): Promise<void> {
  if (!commandName) {
    process.stdout.write(renderRootHelp());
    return;
  }

  const command = findCommand(commandName);
  if (!command) {
    throw usageError(
      `Unknown command: ${commandName}`,
      didYouMean(commandName, COMMAND_NAMES),
      "Run `lattice --help` to see the available commands.",
    );
  }

  const registry = command.extra ? await loadRegistry().catch(() => undefined) : undefined;
  process.stdout.write(renderCommandHelp(command, registry));
}

export async function runCli(argv: string[]): Promise<void> {
  const normalizedArgv = argv[0] === "--" ? argv.slice(1) : argv;
  const parsed = parseTopLevel(normalizedArgv);

  if (parsed.showVersion) {
    process.stdout.write(`${await readCliVersion()}\n`);
    return;
  }

  if (parsed.showHelp || !parsed.command) {
    await printHelp(parsed.commandArgs.find((token) => !token.startsWith("-")));
    return;
  }

  // `--help` anywhere in a command's arguments wins over the rest of the parse, so a half-typed
  // command line still reaches the docs instead of an option error.
  if (parsed.commandArgs.some(isHelpFlag)) {
    await printHelp(parsed.command);
    return;
  }

  if (parsed.command === "init") {
    const initArgs = parseInitArgs(parsed.commandArgs);
    await runInitCommand({
      cwd: process.cwd(),
      ...initArgs,
    });
    return;
  }

  if (parsed.command === "create") {
    const createArgs = parseCreateArgs(parsed.commandArgs);
    await runCreateCommand({
      cwd: process.cwd(),
      ...createArgs,
    });
    return;
  }

  if (parsed.command === "add" || parsed.command === "upgrade" || parsed.command === "remove") {
    const command = parsed.command;
    const selection = parseSelectionArgs(parsed.commandArgs, command);

    // Validate names against the registry before package-manager detection, which can prompt or
    // fail for reasons unrelated to the typo the user actually made.
    const registry = await loadRegistry();
    if (selection.names.length > 0 || selection.presets.length > 0) {
      resolveComponentSelection({ registry }, { names: selection.names, presets: selection.presets });
    }

    const ctx = await createContext(
      {
        cwd: process.cwd(),
        pm: selection.pm,
        dryRun: selection.dryRun,
        yes: selection.yes,
        verbose: selection.verbose,
      },
      { registry },
    );

    const input = { names: selection.names, presets: selection.presets };
    if (command === "add") {
      await runAddCommand(ctx, input);
    } else if (command === "upgrade") {
      await runUpgradeCommand(ctx, input);
    } else {
      await runRemoveCommand(ctx, input);
    }
    return;
  }

  if (parsed.command === "doctor") {
    const doctorArgs = parseDoctorArgs(parsed.commandArgs);
    const ctx = await createContext({
      cwd: process.cwd(),
      pm: doctorArgs.pm,
      dryRun: false,
      yes: false,
      verbose: doctorArgs.verbose,
    });
    await runDoctorCommand(ctx);
    return;
  }

  throw usageError(
    `Unknown command: ${parsed.command}`,
    didYouMean(parsed.command, COMMAND_NAMES),
    "Run `lattice --help` to see the available commands.",
  );
}
