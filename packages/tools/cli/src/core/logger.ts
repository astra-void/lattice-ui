import { createInterface } from "node:readline/promises";
import { ANSI, createStyle, displayWidth, type Style } from "./style";

export interface Spinner {
  succeed(message?: string): void;
  fail(message?: string): void;
  stop(message?: string): void;
}

export type Tone = "plain" | "success" | "warn" | "error";

export type Field = [label: string, value: string];

/** A plain line, or `[term, description]` rendered as an aligned two-column row. */
export type GroupItem = string | [term: string, description: string];

export interface GroupOptions {
  tone?: Tone;
  /** Rows beyond this are replaced with a `…and N more` line. */
  limit?: number;
}

export interface Logger {
  readonly verbose: boolean;
  /** Opens the run and starts the elapsed-time clock. */
  header(title: string, subtitle?: string): void;
  /** Label/value block with the labels aligned against each other. */
  fields(entries: Field[]): void;
  /** Titled block of rows, hung off the gutter. */
  group(title: string, items: GroupItem[], options?: GroupOptions): void;
  /** A shell command, either one the CLI is about to run or one the user could. */
  command(line: string): void;
  /** Closes the run with a single sentence and the elapsed time. */
  outcome(message: string, tone?: Tone): void;
  /** Trailing suggestions, rendered after {@link outcome}. */
  next(commands: string[]): void;
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
  env?: NodeJS.ProcessEnv;
  /** Injectable clock so the elapsed time is deterministic under test. */
  now?: () => number;
}

const TONE_COLOR: Record<Tone, string> = {
  plain: "",
  success: ANSI.green,
  warn: ANSI.yellow,
  error: ANSI.red,
};

/** Pads `text` to `width` visible columns, ignoring escape sequences. */
function padTo(text: string, width: number): string {
  const padding = width - displayWidth(text);
  return padding > 0 ? text + " ".repeat(padding) : text;
}

function formatElapsed(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${Math.round(milliseconds)}ms`;
  }

  return `${(milliseconds / 1000).toFixed(1)}s`;
}

export function createLogger(options: LoggerOptions): Logger {
  const stdin = options.stdin ?? process.stdin;
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;
  const style = createStyle({ stdout, stderr, env: options.env });
  const now = options.now ?? (() => Date.now());

  const glyph = (kind: Parameters<Style["icon"]>[0]) => style.icon(kind);
  // Without box drawing the gutter collapses to plain indentation, so a piped log stays flat.
  const railed = glyph("railBar").length > 0;
  const GUTTER = railed ? `${style.dim(glyph("railBar"))}  ` : "  ";

  let startedAt: number | undefined;
  let closed = false;
  let atStart = true;
  let pendingSpacer = false;
  let lastWasCommand = false;

  function write(stream: NodeJS.WriteStream, text: string) {
    if (pendingSpacer && !atStart) {
      // Inside a rail the separator is a gutter segment, so the line never breaks.
      stream.write(railed ? `${style.dim(glyph("railBar"))}\n` : "\n");
    }
    pendingSpacer = false;
    atStart = false;
    lastWasCommand = false;
    stream.write(`${style.render(text)}\n`);
  }

  function spacerBefore() {
    if (!atStart) {
      pendingSpacer = true;
    }
  }

  function flushSpacer(stream: NodeJS.WriteStream) {
    if (pendingSpacer && !atStart) {
      stream.write(railed ? `${style.dim(glyph("railBar"))}\n` : "\n");
    }
    pendingSpacer = false;
    atStart = false;
  }

  /** Heads a block: a coloured node on the rail, or a tone icon when running flat. */
  function nodePrefix(tone: Tone): string {
    const kind = tone === "warn" ? "railWarn" : tone === "error" ? "railError" : "railNode";
    const marker = glyph(kind);
    if (marker.length === 0) {
      return "  ";
    }

    return `${style.paint(TONE_COLOR[tone] || ANSI.cyan, marker)}  `;
  }

  function renderRows(items: GroupItem[], limit?: number): string[] {
    const visible = limit !== undefined && items.length > limit ? items.slice(0, limit) : items;
    const hidden = items.length - visible.length;
    const rows: string[] = [];

    const terms = visible.filter((item): item is [string, string] => Array.isArray(item));
    const termWidth = terms.length > 0 ? Math.max(...terms.map(([term]) => displayWidth(term))) : 0;

    const total = visible.length + (hidden > 0 ? 1 : 0);
    const branchFor = (index: number) => style.dim(glyph(index === total - 1 ? "branchEnd" : "branch"));

    visible.forEach((item, index) => {
      const body = Array.isArray(item) ? `${style.bold(padTo(item[0], termWidth))}  ${item[1]}` : item;
      rows.push(`${GUTTER}${branchFor(index)} ${body}`);
    });

    if (hidden > 0) {
      rows.push(`${GUTTER}${branchFor(total - 1)} ${style.dim(`…and ${hidden} more`)}`);
    }

    return rows;
  }

  function tagged(stream: NodeJS.WriteStream, tone: Tone, message: string) {
    const icon = tone === "plain" ? "" : style.icon(tone);
    const prefix = icon.length > 0 ? `${style.paint(TONE_COLOR[tone], icon)} ` : GUTTER;
    write(stream, `${prefix}${message}`);
  }

  return {
    verbose: options.verbose,

    header(title: string, subtitle?: string) {
      startedAt = now();
      const open = glyph("railOpen");
      const prefix = open.length > 0 ? `${style.dim(open)}  ` : "";
      const suffix = subtitle ? `   ${style.paint(ANSI.yellow, subtitle)}` : "";
      write(stdout, `${prefix}${style.bold(title)}${suffix}`);
      spacerBefore();
    },

    fields(entries: Field[]) {
      if (entries.length === 0) {
        return;
      }

      const width = Math.max(...entries.map(([label]) => displayWidth(label)));
      for (const [label, value] of entries) {
        write(stdout, `${GUTTER}${style.dim(padTo(label, width))}  ${value}`);
      }
    },

    group(title: string, items: GroupItem[], groupOptions?: GroupOptions) {
      const tone = groupOptions?.tone ?? "plain";
      spacerBefore();
      write(stdout, `${nodePrefix(tone)}${title}`);

      for (const row of renderRows(items, groupOptions?.limit)) {
        write(stdout, row);
      }
    },

    command(commandLine: string) {
      if (!lastWasCommand) {
        spacerBefore();
      }
      write(stdout, `${GUTTER}${style.paint(ANSI.cyan, glyph("command"))} ${style.dim(commandLine)}`);
      lastWasCommand = true;
    },

    outcome(message: string, tone: Tone = "success") {
      spacerBefore();

      const elapsed = startedAt === undefined ? "" : `   ${style.dim(formatElapsed(now() - startedAt))}`;
      const close = glyph("railClose");
      if (close.length === 0) {
        tagged(stdout, tone, `${message}${elapsed}`);
        closed = true;
        return;
      }

      write(stdout, `${style.paint(TONE_COLOR[tone] || ANSI.cyan, close)}  ${message}${elapsed}`);
      closed = true;
    },

    next(commands: string[]) {
      if (commands.length === 0) {
        return;
      }

      // Past the closing cap the gutter is gone, so the separator is a real blank line and the
      // commands sit on their own indent rather than hanging off a rail that already ended.
      const detached = railed && closed;
      if (!atStart) {
        stdout.write(detached || !railed ? "\n" : `${style.dim(glyph("railBar"))}\n`);
      }
      pendingSpacer = false;
      atStart = false;

      const indent = detached ? "   " : GUTTER;
      for (const entry of commands) {
        stdout.write(style.render(`${indent}${style.paint(ANSI.cyan, glyph("command"))} ${entry}\n`));
      }
    },

    warn(message: string) {
      tagged(stderr, "warn", message);
    },

    error(message: string) {
      tagged(stderr, "error", message);
    },

    debug(message: string) {
      if (options.verbose) {
        write(stdout, `${GUTTER}${style.dim(`${glyph("debug")} ${message}`)}`);
      }
    },

    async confirm(message: string) {
      if (options.yes) {
        return true;
      }

      if (!stdin.isTTY || !stdout.isTTY) {
        tagged(stderr, "warn", `${message} (confirmation required; pass --yes in non-interactive mode)`);
        return false;
      }

      spacerBefore();
      flushSpacer(stdout);

      const rl = createInterface({ input: stdin, output: stdout });
      try {
        const prefix = style.paint(ANSI.magenta, glyph("question"));
        const answer = await rl.question(style.render(`${prefix}  ${message} ${style.dim("[y/N]")} `));
        const normalized = answer.trim().toLowerCase();
        return normalized === "y" || normalized === "yes";
      } finally {
        rl.close();
      }
    },

    spinner(message: string): Spinner {
      if (!stdout.isTTY || options.verbose) {
        write(stdout, `${GUTTER}${style.dim(message)}`);
        return {
          succeed(nextMessage?: string) {
            if (nextMessage) {
              tagged(stdout, "success", nextMessage);
            }
          },
          fail(nextMessage?: string) {
            if (nextMessage) {
              tagged(stderr, "error", nextMessage);
            }
          },
          stop(nextMessage?: string) {
            if (nextMessage) {
              write(stdout, `${GUTTER}${style.dim(nextMessage)}`);
            }
          },
        };
      }

      flushSpacer(stdout);
      lastWasCommand = false;

      const frames = style.spinnerFrames;
      let frameIndex = 0;
      const render = (frame: string) => style.render(`${GUTTER}${style.paint(ANSI.cyan, frame)} ${message}`);
      stdout.write(render(frames[frameIndex]));

      const timer = setInterval(() => {
        frameIndex = (frameIndex + 1) % frames.length;
        stdout.write(`\r${render(frames[frameIndex])}`);
      }, 80);

      let finished = false;
      const finish = (tone: Tone, nextMessage?: string, stream?: NodeJS.WriteStream) => {
        if (finished) {
          return;
        }

        finished = true;
        clearInterval(timer);
        const output = stream ?? stdout;
        const icon = tone === "plain" ? "" : style.icon(tone);
        const prefix = icon.length > 0 ? `${style.paint(TONE_COLOR[tone], icon)} ` : GUTTER;
        const body = tone === "plain" ? style.dim(nextMessage ?? message) : (nextMessage ?? message);
        // `\r` alone leaves the tail of a longer spinner line behind, so clear to end of line.
        output.write(style.render(`\r\u001b[K${prefix}${body}\n`));
      };

      return {
        succeed(nextMessage?: string) {
          finish("success", nextMessage, stdout);
        },
        fail(nextMessage?: string) {
          finish("error", nextMessage, stderr);
        },
        stop(nextMessage?: string) {
          finish("plain", nextMessage, stdout);
        },
      };
    },
  };
}
