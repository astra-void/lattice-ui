export enum ExitCode {
  Success = 0,
  Unexpected = 1,
  Usage = 2,
  ProjectNotFound = 3,
  RegistryInvalid = 4,
  PackageManagerFailed = 5,
}

export type CliErrorKind =
  | "Usage"
  | "Validation"
  | "ProjectNotFound"
  | "RegistryInvalid"
  | "PackageManagerFailed"
  | "Unexpected";

export class CliError extends Error {
  readonly kind: CliErrorKind;
  readonly exitCode: ExitCode;
  readonly cause?: unknown;
  /** Actionable follow-up shown under the error message, one line per entry. */
  readonly hints: string[];
  /**
   * The command already told the user what went wrong, so the top-level handler contributes only
   * the exit code. Without this a command that closes with its own verdict line would have that
   * same sentence repeated back as `Error: ...`.
   */
  reported = false;

  constructor(message: string, kind: CliErrorKind, exitCode: ExitCode, cause?: unknown, hints: string[] = []) {
    super(message);
    this.name = "CliError";
    this.kind = kind;
    this.exitCode = exitCode;
    this.cause = cause;
    this.hints = hints;
  }
}

/** `undefined` hints are dropped so callers can inline optional suggestions. */
export function usageError(message: string, ...hints: (string | undefined)[]): CliError {
  return new CliError(
    message,
    "Usage",
    ExitCode.Usage,
    undefined,
    hints.filter((hint) => hint !== undefined),
  );
}

export function validationError(message: string, ...hints: (string | undefined)[]): CliError {
  return new CliError(
    message,
    "Validation",
    ExitCode.Usage,
    undefined,
    hints.filter((hint) => hint !== undefined),
  );
}

export function projectNotFoundError(cwd: string): CliError {
  return new CliError(
    `Could not find package.json from "${cwd}".`,
    "ProjectNotFound",
    ExitCode.ProjectNotFound,
    undefined,
    ["Run the command inside a project, or scaffold one with `lattice create`."],
  );
}

export function registryInvalidError(message: string, cause?: unknown): CliError {
  return new CliError(message, "RegistryInvalid", ExitCode.RegistryInvalid, cause);
}

/** Marks an error whose message the command has already printed itself. */
export function asReported(error: CliError): CliError {
  error.reported = true;
  return error;
}

export function packageManagerFailedError(message: string, cause?: unknown): CliError {
  return new CliError(message, "PackageManagerFailed", ExitCode.PackageManagerFailed, cause);
}

export function toCliError(error: unknown): CliError {
  if (error instanceof CliError) {
    return error;
  }

  if (error instanceof Error) {
    return new CliError(error.message, "Unexpected", ExitCode.Unexpected, error);
  }

  return new CliError("Unexpected unknown error.", "Unexpected", ExitCode.Unexpected, error);
}
