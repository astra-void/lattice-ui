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
  section(title: string): void;
  kv(label: string, value: string): void;
  step(message: string): void;
  list(items: string[]): void;
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
const ICONS = {
  tty: {
    info: "?",
    success: "✔",
    warn: "⚠",
    error: "✖",
    step: "›",
    debug: "·",
  },
  plain: {
    info: "[?]",
    success: "[+]",
    warn: "[!]",
    error: "[x]",
    step: "[>]",
    debug: "[d]",
  },
} as const;

const ANSI = {
  reset: "\u001b[0m",
  cyan: "\u001b[36m",
  green: "\u001b[32m",
  yellow: "\u001b[33m",
  red: "\u001b[31m",
  magenta: "\u001b[35m",
  gray: "\u001b[90m",
  bold: "\u001b[1m",
} as const;

function isTTY(stdout: NodeJS.WriteStream, stderr: NodeJS.WriteStream): boolean {
  return Boolean(stdout.isTTY || stderr.isTTY);
}

function colorize(enabled: boolean, color: string, text: string): string {
  if (!enabled) {
    return text;
  }

  return `${color}${text}${ANSI.reset}`;
}

export function createLogger(options: LoggerOptions): Logger {
  const stdin = options.stdin ?? process.stdin;
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;
  const useColor = isTTY(stdout, stderr);
  const useUnicodeIcons = isTTY(stdout, stderr);

  function icon(kind: keyof typeof ICONS.tty): string {
    return useUnicodeIcons ? ICONS.tty[kind] : ICONS.plain[kind];
  }

  function write(
    stream: NodeJS.WriteStream,
    iconKey: keyof typeof ICONS.tty,
    message: string,
    color: string,
    tokenOnlyColor = true,
    leadingNewline = false,
  ) {
    const token = icon(iconKey);
    const decoratedToken = tokenOnlyColor ? colorize(useColor, color, token) : token;
    const decoratedMessage = tokenOnlyColor ? message : colorize(useColor, color, message);
    const prefix = token.length > 0 ? `${decoratedToken} ` : "";
    stream.write(`${leadingNewline ? "\n" : ""}${prefix}${decoratedMessage}\n`);
  }

  return {
    verbose: options.verbose,
    info(message: string) {
      write(stdout, "info", message, ANSI.cyan);
    },
    success(message: string) {
      write(stdout, "success", message, ANSI.green);
    },
    warn(message: string) {
      write(stderr, "warn", message, ANSI.yellow);
    },
    error(message: string) {
      write(stderr, "error", message, ANSI.red);
    },
    debug(message: string) {
      if (options.verbose) {
        write(stdout, "debug", message, ANSI.gray);
      }
    },
    section(title: string) {
      const text = useColor ? `${ANSI.bold}${title}${ANSI.reset}` : title;
      write(stdout, "step", text, ANSI.magenta, true, true);
    },
    kv(label: string, value: string) {
      const labelText = useColor ? `${ANSI.bold}${label}${ANSI.reset}` : label;
      write(stdout, "info", `${labelText}: ${value}`, ANSI.cyan);
    },
    step(message: string) {
      write(stdout, "step", message, ANSI.cyan);
    },
    list(items: string[]) {
      for (const item of items) {
        const bullet = colorize(useColor, ANSI.gray, "-");
        stdout.write(`    ${bullet} ${item}\n`);
      }
    },
    async confirm(message: string) {
      if (options.yes) {
        return true;
      }

      if (!stdin.isTTY || !stdout.isTTY) {
        write(stderr, "warn", `${message} (confirmation required; pass --yes in non-interactive mode)`, ANSI.yellow);
        return false;
      }

      const rl = createInterface({ input: stdin, output: stdout });
      try {
        const answer = await rl.question(`${colorize(useColor, ANSI.cyan, icon("step"))} ${message} [y/N] `);
        const normalized = answer.trim().toLowerCase();
        return normalized === "y" || normalized === "yes";
      } finally {
        rl.close();
      }
    },
    spinner(message: string): Spinner {
      if (!stdout.isTTY || options.verbose) {
        write(stdout, "step", message, ANSI.cyan);
        return {
          succeed(nextMessage?: string) {
            if (nextMessage) {
              write(stdout, "success", nextMessage, ANSI.green);
            }
          },
          fail(nextMessage?: string) {
            if (nextMessage) {
              write(stderr, "error", nextMessage, ANSI.red);
            }
          },
          stop(nextMessage?: string) {
            if (nextMessage) {
              write(stdout, "info", nextMessage, ANSI.cyan);
            }
          },
        };
      }

      let frameIndex = 0;
      const renderFrame = (frame: string) => `${colorize(useColor, ANSI.cyan, frame)} ${message}`;
      stdout.write(renderFrame(FRAMES[frameIndex]));

      const timer = setInterval(() => {
        frameIndex = (frameIndex + 1) % FRAMES.length;
        stdout.write(`\r${renderFrame(FRAMES[frameIndex])}`);
      }, 80);

      let finished = false;
      const stop = (token: string, color: string, nextMessage?: string, stream?: NodeJS.WriteStream) => {
        if (finished) {
          return;
        }

        finished = true;
        clearInterval(timer);
        const output = stream ?? stdout;
        const finalToken = colorize(useColor, color, token);
        const finalMessage = nextMessage ?? message;
        output.write(`\r${finalToken} ${finalMessage}\n`);
      };

      return {
        succeed(nextMessage?: string) {
          stop(icon("success"), ANSI.green, nextMessage, stdout);
        },
        fail(nextMessage?: string) {
          stop(icon("error"), ANSI.red, nextMessage, stderr);
        },
        stop(nextMessage?: string) {
          stop(icon("info"), ANSI.cyan, nextMessage, stdout);
        },
      };
    },
  };
}
