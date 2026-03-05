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

function getRuntimeStreams(runtime: PromptRuntime): {
  stdin: NodeJS.ReadStream;
  stdout: NodeJS.WriteStream;
} {
  const stdin = runtime.stdin ?? process.stdin;
  const stdout = runtime.stdout ?? process.stdout;

  return { stdin, stdout };
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
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const suffix = defaultValue !== undefined ? ` (${defaultValue})` : "";
    const answer = await rl.question(`${message}${suffix}: `);
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
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const hint = defaultValue ? "Y/n" : "y/N";
    const answer = (await rl.question(`${message} [${hint}] `)).trim().toLowerCase();

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
  stdout.write(`${message}\n`);
  options.forEach((option, index) => {
    stdout.write(`  ${index + 1}. ${option.label}\n`);
  });

  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = (await rl.question(`Select one [${defaultIndex + 1}]: `)).trim();
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
  stdout.write(`${message}\n`);
  options.forEach((option, index) => {
    stdout.write(`  ${index + 1}. ${option.label}\n`);
  });

  const defaultText =
    defaultIndices.length > 0
      ? ` [${defaultIndices.map((index) => index + 1).join(",")}]`
      : allowEmpty
        ? " [enter to skip]"
        : "";

  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = (await rl.question(`Select one or more (comma-separated)${defaultText}: `)).trim();
    const indices = answer.length > 0 ? parseCsvIndices(answer, options.length) : defaultIndices;

    if (indices.length === 0 && !allowEmpty) {
      throw usageError("At least one option must be selected.");
    }

    return indices.map((index) => options[index].value);
  } finally {
    rl.close();
  }
}
