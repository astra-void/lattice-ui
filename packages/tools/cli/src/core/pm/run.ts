import { spawn } from "node:child_process";
import { packageManagerFailedError } from "../errors";

export interface RunProcessOptions {
  cwd: string;
  /**
   * Stream the child's output straight to the terminal instead of buffering it.
   *
   * Inherited output fights the spinner for the current line — the package manager writes a
   * newline mid-animation and the next frame lands after it, scattering frames through the
   * install log. Buffering keeps the run's layout intact; the output is surfaced on failure,
   * which is the only time it carries information the CLI has not already reported.
   */
  stream: boolean;
}

/** Lines of a failed child's output attached to the error, newest last. */
const FAILURE_TAIL_LINES = 12;

function tail(output: string): string[] {
  const lines = output
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  return lines.slice(-FAILURE_TAIL_LINES);
}

export function runProcess(command: string, args: string[], options: RunProcessOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: options.stream ? "inherit" : ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    });

    let captured = "";
    if (!options.stream) {
      child.stdout?.on("data", (chunk: Buffer) => {
        captured += chunk.toString("utf8");
      });
      child.stderr?.on("data", (chunk: Buffer) => {
        captured += chunk.toString("utf8");
      });
    }

    child.on("error", (error) => {
      reject(packageManagerFailedError(`Failed to run ${command}: ${error.message}`, error));
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      const error = packageManagerFailedError(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}.`);
      error.hints.push(...tail(captured));
      reject(error);
    });
  });
}
