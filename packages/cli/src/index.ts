#!/usr/bin/env node

import { runCli } from "./cli";
import { ExitCode, toCliError } from "./core/errors";

function isPreviewBuildError(error: unknown): error is {
  errors: Array<{ code: string; file: string; line: number; column: number; message?: string; summary?: string }>;
} {
  return (
    error instanceof Error &&
    error.name === "PreviewBuildError" &&
    Array.isArray((error as { errors?: unknown }).errors)
  );
}

async function main() {
  try {
    await runCli(process.argv.slice(2));
  } catch (error) {
    if (isPreviewBuildError(error)) {
      for (const item of error.errors) {
        process.stderr.write(`${item.code} ${item.file}:${item.line}:${item.column} ${item.summary ?? item.message}\n`);
      }
      process.exitCode = ExitCode.Unexpected;
      return;
    }

    const cliError = toCliError(error);
    process.stderr.write(`Error: ${cliError.message}\n`);

    if (cliError.kind === "Unexpected" && cliError.cause instanceof Error) {
      process.stderr.write(`${cliError.cause.stack ?? cliError.cause.message}\n`);
    }

    process.exitCode = cliError.exitCode;
    return;
  }

  process.exitCode = ExitCode.Success;
}

void main();
