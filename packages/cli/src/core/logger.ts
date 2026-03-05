import { createInterface } from "node:readline/promises";

export interface Spinner {
  succeed(message?: string): void;
  fail(message?: string): void;
  stop(message?: string): void;
}

export interface Logger {
  readonly verbose: boolean;
  info(message: string): void;
  success(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
  confirm(message: string): Promise<boolean>;
  spinner(message: string): Spinner;
}

export interface LoggerOptions {
  verbose: boolean;
  yes: boolean;
  stdin?: NodeJS.ReadStream;
  stdout?: NodeJS.WriteStream;
  stderr?: NodeJS.WriteStream;
}

const FRAMES = ["-", "\\", "|", "/"] as const;

export function createLogger(options: LoggerOptions): Logger {
  const stdin = options.stdin ?? process.stdin;
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;

  function write(stream: NodeJS.WriteStream, prefix: string, message: string) {
    stream.write(`${prefix}${message}\n`);
  }

  return {
    verbose: options.verbose,
    info(message: string) {
      write(stdout, "", message);
    },
    success(message: string) {
      write(stdout, "✔ ", message);
    },
    warn(message: string) {
      write(stderr, "⚠ ", message);
    },
    error(message: string) {
      write(stderr, "✖ ", message);
    },
    debug(message: string) {
      if (options.verbose) {
        write(stdout, "[debug] ", message);
      }
    },
    async confirm(message: string) {
      if (options.yes) {
        return true;
      }

      if (!stdin.isTTY || !stdout.isTTY) {
        write(stderr, "", `${message} (confirmation required; pass --yes in non-interactive mode)`);
        return false;
      }

      const rl = createInterface({ input: stdin, output: stdout });
      try {
        const answer = await rl.question(`${message} [y/N] `);
        const normalized = answer.trim().toLowerCase();
        return normalized === "y" || normalized === "yes";
      } finally {
        rl.close();
      }
    },
    spinner(message: string): Spinner {
      if (!stdout.isTTY || options.verbose) {
        write(stdout, "", message);
        return {
          succeed(nextMessage?: string) {
            if (nextMessage) {
              write(stdout, "✔ ", nextMessage);
            }
          },
          fail(nextMessage?: string) {
            if (nextMessage) {
              write(stderr, "✖ ", nextMessage);
            }
          },
          stop(nextMessage?: string) {
            if (nextMessage) {
              write(stdout, "", nextMessage);
            }
          },
        };
      }

      let frameIndex = 0;
      stdout.write(`${FRAMES[frameIndex]} ${message}`);
      const timer = setInterval(() => {
        frameIndex = (frameIndex + 1) % FRAMES.length;
        stdout.write(`\r${FRAMES[frameIndex]} ${message}`);
      }, 80);

      let finished = false;
      const stop = (prefix: string, nextMessage?: string, stream?: NodeJS.WriteStream) => {
        if (finished) {
          return;
        }

        finished = true;
        clearInterval(timer);
        const output = stream ?? stdout;
        output.write(`\r${prefix}${nextMessage ?? message}\n`);
      };

      return {
        succeed(nextMessage?: string) {
          stop("✔ ", nextMessage, stdout);
        },
        fail(nextMessage?: string) {
          stop("✖ ", nextMessage, stderr);
        },
        stop(nextMessage?: string) {
          stop("", nextMessage, stdout);
        },
      };
    },
  };
}
