import { createInterface } from "node:readline/promises";
import { usageError } from "./errors";

export interface PromptRuntime {
  yes: boolean;
  stdin?: NodeJS.ReadStream;
  stdout?: NodeJS.WriteStream;
}

export interface PromptOption<T> {
  label: string;
  value: T;
}

const ANSI = {
  reset: "\u001b[0m",
  cyan: "\u001b[36m",
  magenta: "\u001b[35m",
  gray: "\u001b[90m",
  bold: "\u001b[1m",
} as const;

const ICONS = {
  tty: {
    question: "?",
    guide: "›",
  },
  plain: {
    question: "[?]",
    guide: "[>]",
  },
} as const;

function supportsColor(stdout: NodeJS.WriteStream): boolean {
  return Boolean(stdout.isTTY);
}

function supportsUnicodeIcons(stdout: NodeJS.WriteStream): boolean {
  return Boolean(stdout.isTTY);
}

function colorize(enabled: boolean, color: string, text: string): string {
  if (!enabled) {
    return text;
  }

  return `${color}${text}${ANSI.reset}`;
}

function getRuntimeStreams(runtime: PromptRuntime): {
  stdin: NodeJS.ReadStream;
  stdout: NodeJS.WriteStream;
} {
  const stdin = runtime.stdin ?? process.stdin;
  const stdout = runtime.stdout ?? process.stdout;

  return { stdin, stdout };
}

function getPromptIcon(stdout: NodeJS.WriteStream, kind: keyof typeof ICONS.tty): string {
  if (supportsUnicodeIcons(stdout)) {
    return ICONS.tty[kind];
  }

  return ICONS.plain[kind];
}

function ensureInteractive(runtime: PromptRuntime): {
  stdin: NodeJS.ReadStream;
  stdout: NodeJS.WriteStream;
} {
  const { stdin, stdout } = getRuntimeStreams(runtime);

  if (runtime.yes) {
    return { stdin, stdout };
  }

  if (!stdin.isTTY || !stdout.isTTY) {
    throw usageError("Interactive prompts require a TTY. Re-run with --yes and explicit options.");
  }

  return { stdin, stdout };
}

function printPromptHeader(stdout: NodeJS.WriteStream, message: string) {
  const useColor = supportsColor(stdout);
  const icon = colorize(useColor, ANSI.magenta, getPromptIcon(stdout, "question"));
  const heading = colorize(useColor, ANSI.bold, message);
  stdout.write(`\n${icon} ${heading}\n`);
}

function printPromptGuide(stdout: NodeJS.WriteStream, message: string) {
  const useColor = supportsColor(stdout);
  const icon = colorize(useColor, ANSI.cyan, getPromptIcon(stdout, "guide"));
  const text = colorize(useColor, ANSI.gray, message);
  stdout.write(`${icon} ${text}\n`);
}

function parseCsvIndices(input: string, optionCount: number): number[] {
  if (input.trim().length === 0) {
    return [];
  }

  const output: number[] = [];
  const parts = input
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  for (const part of parts) {
    const parsed = Number(part);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > optionCount) {
      throw usageError(`Invalid selection "${part}". Choose numbers between 1 and ${optionCount}.`);
    }

    const index = parsed - 1;
    if (!output.includes(index)) {
      output.push(index);
    }
  }

  return output;
}

export async function promptInput(
  runtime: PromptRuntime,
  message: string,
  config?: { defaultValue?: string; required?: boolean },
): Promise<string> {
  const required = config?.required ?? true;
  const defaultValue = config?.defaultValue;

  if (runtime.yes) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }

    if (required) {
      throw usageError(`Missing required value for prompt: ${message}`);
    }

    return "";
  }

  const { stdin, stdout } = ensureInteractive(runtime);
  printPromptHeader(stdout, message);

  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const suffix = defaultValue !== undefined ? ` (default: ${defaultValue})` : "";
    const answer = await rl.question(`${getPromptIcon(stdout, "guide")} Value${suffix}: `);
    const trimmed = answer.trim();

    if (trimmed.length > 0) {
      return trimmed;
    }

    if (defaultValue !== undefined) {
      return defaultValue;
    }

    if (required) {
      throw usageError(`Missing required value for prompt: ${message}`);
    }

    return "";
  } finally {
    rl.close();
  }
}

export async function promptConfirm(
  runtime: PromptRuntime,
  message: string,
  config?: { defaultValue?: boolean },
): Promise<boolean> {
  const defaultValue = config?.defaultValue ?? false;

  if (runtime.yes) {
    return defaultValue;
  }

  const { stdin, stdout } = ensureInteractive(runtime);
  printPromptHeader(stdout, message);

  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const hint = defaultValue ? "Y/n" : "y/N";
    const answer = (await rl.question(`${getPromptIcon(stdout, "guide")} Confirm (${hint}): `)).trim().toLowerCase();

    if (answer.length === 0) {
      return defaultValue;
    }

    if (answer === "y" || answer === "yes") {
      return true;
    }

    if (answer === "n" || answer === "no") {
      return false;
    }

    throw usageError(`Invalid confirmation response "${answer}".`);
  } finally {
    rl.close();
  }
}

export async function promptSelect<T>(
  runtime: PromptRuntime,
  message: string,
  options: PromptOption<T>[],
  config?: { defaultIndex?: number },
): Promise<T> {
  if (options.length === 0) {
    throw usageError(`Prompt "${message}" has no options.`);
  }

  const defaultIndex = config?.defaultIndex ?? 0;
  if (defaultIndex < 0 || defaultIndex >= options.length) {
    throw usageError(`Prompt "${message}" has an invalid default index.`);
  }

  if (runtime.yes) {
    return options[defaultIndex].value;
  }

  const { stdin, stdout } = ensureInteractive(runtime);
  printPromptHeader(stdout, message);

  options.forEach((option, index) => {
    stdout.write(`  ${index + 1}) ${option.label}\n`);
  });
  printPromptGuide(stdout, `Enter a number (default: ${defaultIndex + 1})`);

  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = (await rl.question(`${getPromptIcon(stdout, "guide")} Select one: `)).trim();
    const indices = parseCsvIndices(answer, options.length);

    if (indices.length === 0) {
      return options[defaultIndex].value;
    }

    if (indices.length > 1) {
      throw usageError("Select exactly one option.");
    }

    return options[indices[0]].value;
  } finally {
    rl.close();
  }
}

export async function promptMultiSelect<T>(
  runtime: PromptRuntime,
  message: string,
  options: PromptOption<T>[],
  config?: { allowEmpty?: boolean; defaultIndices?: number[] },
): Promise<T[]> {
  if (options.length === 0) {
    return [];
  }

  const allowEmpty = config?.allowEmpty ?? false;
  const defaultIndices = (config?.defaultIndices ?? []).filter((index) => index >= 0 && index < options.length);

  if (runtime.yes) {
    return defaultIndices.map((index) => options[index].value);
  }

  const { stdin, stdout } = ensureInteractive(runtime);
  printPromptHeader(stdout, message);

  options.forEach((option, index) => {
    stdout.write(`  ${index + 1}) ${option.label}\n`);
  });

  const defaultText =
    defaultIndices.length > 0
      ? `default: ${defaultIndices.map((index) => index + 1).join(",")}`
      : allowEmpty
        ? "press enter to skip"
        : "select at least one item";
  printPromptGuide(stdout, `Enter comma-separated numbers (${defaultText})`);

  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = (await rl.question(`${getPromptIcon(stdout, "guide")} Select one or more: `)).trim();
    const indices = answer.length > 0 ? parseCsvIndices(answer, options.length) : defaultIndices;

    if (indices.length === 0 && !allowEmpty) {
      throw usageError("At least one option must be selected.");
    }

    return indices.map((index) => options[index].value);
  } finally {
    rl.close();
  }
}
