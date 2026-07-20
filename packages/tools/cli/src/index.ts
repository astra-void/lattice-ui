#!/usr/bin/env node

import { runCli } from "./cli";
import { type CliError, ExitCode, toCliError } from "./core/errors";
import { shouldUseColor } from "./core/style";

const ANSI = {
  reset: "\u001b[0m",
  red: "\u001b[31m",
  gray: "\u001b[90m",
} as const;

function reportError(cliError: CliError) {
  if (cliError.reported) {
    return;
  }

  const colored = shouldUseColor(process.stdout, process.stderr);
  const label = colored ? `${ANSI.red}Error${ANSI.reset}` : "Error";
  process.stderr.write(`${label}: ${cliError.message}\n`);

  for (const hint of cliError.hints) {
    const line = `  ${hint}`;
    process.stderr.write(`${colored ? `${ANSI.gray}${line}${ANSI.reset}` : line}\n`);
  }

  // Stack traces are noise for the error kinds we raise deliberately; only unexpected failures,
  // which are bugs, get the full trace.
  if (cliError.kind === "Unexpected" && cliError.cause instanceof Error) {
    process.stderr.write(`${cliError.cause.stack ?? cliError.cause.message}\n`);
  }
}

async function main() {
  try {
    await runCli(process.argv.slice(2));
  } catch (error) {
    const cliError = toCliError(error);
    reportError(cliError);
    process.exitCode = cliError.exitCode;
    return;
  }

  process.exitCode = ExitCode.Success;
}

void main();
