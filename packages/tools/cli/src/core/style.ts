/**
 * Shared terminal styling for the logger and the interactive prompts.
 *
 * Both used to carry their own copy of the ANSI table, the icon table and the TTY checks, which
 * drifted: the same `?` glyph meant "question" in one and "informational" in the other.
 */

/** Frames for the progress spinner, in preference order. */
export const SPINNER_FRAMES = {
  unicode: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  ascii: ["-", "\\", "|", "/"],
} as const;

export const ANSI = {
  reset: "\u001b[0m",
  bold: "\u001b[1m",
  dim: "\u001b[2m",
  cyan: "\u001b[36m",
  green: "\u001b[32m",
  yellow: "\u001b[33m",
  red: "\u001b[31m",
  magenta: "\u001b[35m",
  gray: "\u001b[90m",
} as const;

export type IconKind =
  | "success"
  | "warn"
  | "error"
  | "command"
  | "debug"
  | "question"
  | "cursor"
  | "on"
  | "off"
  /** Opens the vertical gutter that threads a whole run together. */
  | "railOpen"
  | "railBar"
  | "railClose"
  /** Heads a titled block hanging off the gutter. */
  | "railNode"
  | "railWarn"
  | "railError"
  /** Tree branches for the rows inside a block. */
  | "branch"
  | "branchEnd";

const ICONS: Record<"unicode" | "ascii", Record<IconKind, string>> = {
  unicode: {
    success: "✔",
    warn: "⚠",
    error: "✖",
    command: "›",
    debug: "·",
    question: "?",
    cursor: "❯",
    on: "◉",
    off: "◯",
    railOpen: "┌",
    railBar: "│",
    railClose: "└",
    railNode: "◇",
    railWarn: "▲",
    railError: "■",
    branch: "├",
    branchEnd: "└",
  },
  ascii: {
    success: "[+]",
    warn: "[!]",
    error: "[x]",
    command: ">",
    debug: "[d]",
    question: "?",
    cursor: ">",
    on: "[x]",
    off: "[ ]",
    // A piped or redirected stream gets the flat layout instead: box drawing in a log file is
    // noise, so the gutter collapses to plain indentation.
    railOpen: "",
    railBar: "",
    railClose: "",
    railNode: "",
    railWarn: "[!]",
    railError: "[x]",
    branch: "-",
    branchEnd: "-",
  },
};

export interface StyleOptions {
  stdout: NodeJS.WriteStream;
  stderr?: NodeJS.WriteStream;
  env?: NodeJS.ProcessEnv;
}

export interface Style {
  readonly color: boolean;
  readonly unicode: boolean;
  readonly hyperlinks: boolean;
  /** Terminal width, or a sane default when the stream is not a terminal. */
  readonly width: number;
  /** Terminal height, or a sane default when the stream is not a terminal. */
  readonly rows: number;
  readonly spinnerFrames: readonly string[];
  icon(kind: IconKind): string;
  paint(color: string, text: string): string;
  bold(text: string): string;
  dim(text: string): string;
  /** Renders `text` for output, dropping any hyperlink the terminal cannot follow. */
  render(text: string): string;
}

function isTTY(stdout: NodeJS.WriteStream, stderr?: NodeJS.WriteStream): boolean {
  return Boolean(stdout.isTTY || stderr?.isTTY);
}

/**
 * Honours the informal `NO_COLOR` / `FORCE_COLOR` contract before falling back to TTY detection,
 * so CI logs and `| less` stay readable and users can force colour through a pipe.
 */
export function shouldUseColor(
  stdout: NodeJS.WriteStream,
  stderr?: NodeJS.WriteStream,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.NO_COLOR !== undefined && env.NO_COLOR !== "") {
    return false;
  }

  if (env.FORCE_COLOR !== undefined && env.FORCE_COLOR !== "") {
    return env.FORCE_COLOR !== "0";
  }

  if (env.TERM === "dumb") {
    return false;
  }

  return isTTY(stdout, stderr);
}

/**
 * Terminals that do not understand OSC 8 mostly ignore it, but a few print the raw sequence, so
 * this stays opt-out via `NO_HYPERLINK` and off outside a terminal.
 */
export function shouldUseHyperlinks(
  stdout: NodeJS.WriteStream,
  stderr?: NodeJS.WriteStream,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.NO_HYPERLINK !== undefined && env.NO_HYPERLINK !== "") {
    return false;
  }

  if (env.FORCE_HYPERLINK !== undefined && env.FORCE_HYPERLINK !== "") {
    return env.FORCE_HYPERLINK !== "0";
  }

  if (env.TERM === "dumb" || env.CI !== undefined) {
    return false;
  }

  return isTTY(stdout, stderr);
}

// biome-ignore lint/suspicious/noControlCharactersInRegex: matching terminal escapes is the point
const OSC8_PATTERN = /\u001b\]8;;(.*?)(?:\u0007|\u001b\\)/g;
// biome-ignore lint/suspicious/noControlCharactersInRegex: matching terminal escapes is the point
const CSI_PATTERN = /\u001b\[[0-9;?]*[A-Za-z]/g;

/**
 * Wraps `text` in an OSC 8 hyperlink.
 *
 * Callers build these without knowing whether the terminal supports them; {@link Style.render}
 * drops the escapes when it does not, leaving the plain label behind.
 */
export function hyperlink(text: string, url: string): string {
  return `\u001b]8;;${url}\u0007${text}\u001b]8;;\u0007`;
}

/** Strips every escape sequence, leaving only what the terminal actually shows. */
export function stripEscapes(text: string): string {
  return text.replace(OSC8_PATTERN, "").replace(CSI_PATTERN, "");
}

/**
 * Columns `text` occupies once rendered.
 *
 * Padding is computed against this rather than `String.length`, because a hyperlinked or coloured
 * value carries escape bytes that take no space on screen and would otherwise skew every column.
 */
export function displayWidth(text: string): number {
  return [...stripEscapes(text)].length;
}

export function createStyle(options: StyleOptions): Style {
  const env = options.env ?? process.env;
  const color = shouldUseColor(options.stdout, options.stderr, env);
  // Glyphs are a terminal-capability question, not a preference one, so NO_COLOR does not
  // downgrade them; a redirected stream does, because the consumer is usually a log file.
  const unicode = isTTY(options.stdout, options.stderr);
  const hyperlinks = shouldUseHyperlinks(options.stdout, options.stderr, env);
  const table = unicode ? ICONS.unicode : ICONS.ascii;

  function paint(code: string, text: string): string {
    return color ? `${code}${text}${ANSI.reset}` : text;
  }

  return {
    color,
    unicode,
    hyperlinks,
    width: options.stdout.columns ?? 80,
    rows: options.stdout.rows ?? 24,
    spinnerFrames: unicode ? SPINNER_FRAMES.unicode : SPINNER_FRAMES.ascii,
    icon(kind: IconKind) {
      return table[kind];
    },
    paint,
    bold(text: string) {
      return paint(ANSI.bold, text);
    },
    dim(text: string) {
      return paint(ANSI.gray, text);
    },
    render(text: string) {
      return hyperlinks ? text : text.replace(OSC8_PATTERN, "");
    },
  };
}
