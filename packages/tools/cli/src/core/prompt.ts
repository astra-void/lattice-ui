import { createInterface } from "node:readline/promises";
import { usageError } from "./errors";
import { ANSI, createStyle, type Style } from "./style";

export interface PromptRuntime {
  yes: boolean;
  stdin?: NodeJS.ReadStream;
  stdout?: NodeJS.WriteStream;
}

export interface PromptOption<T> {
  label: string;
  value: T;
}

interface Streams {
  stdin: NodeJS.ReadStream;
  stdout: NodeJS.WriteStream;
  style: Style;
}

function getStreams(runtime: PromptRuntime): Streams {
  const stdin = runtime.stdin ?? process.stdin;
  const stdout = runtime.stdout ?? process.stdout;

  return { stdin, stdout, style: createStyle({ stdout }) };
}

function ensureInteractive(runtime: PromptRuntime): Streams {
  const streams = getStreams(runtime);

  if (runtime.yes) {
    return streams;
  }

  if (!streams.stdin.isTTY || !streams.stdout.isTTY) {
    throw usageError(
      "Interactive prompts require a TTY.",
      "Re-run with --yes and pass the values explicitly as options.",
    );
  }

  return streams;
}

function printHeader(streams: Streams, message: string) {
  const { stdout, style } = streams;
  stdout.write(`\n${style.paint(ANSI.magenta, style.icon("question"))} ${style.bold(message)}\n`);
}

function printGuide(streams: Streams, message: string) {
  const { stdout, style } = streams;
  stdout.write(`${style.dim(`  ${message}`)}\n`);
}

/**
 * Raw mode is what makes arrow keys and space reach us at all — line mode would buffer until
 * Enter. `keypress` needs the terminal in raw mode, so both are toggled together and always
 * restored, including when the caller aborts.
 */
function withRawMode<T>(
  streams: Streams,
  run: (finish: (value: T) => void, abort: () => void) => () => void,
): Promise<T> {
  const { stdin, stdout } = streams;

  return new Promise<T>((resolve, reject) => {
    const wasRaw = stdin.isRaw ?? false;
    stdin.setRawMode(true);
    stdin.resume();
    stdout.write("\u001b[?25l");

    let cleanup: (() => void) | undefined;
    let restored = false;
    const restore = () => {
      if (restored) {
        return;
      }

      restored = true;
      process.off("exit", restore);
      cleanup?.();
      stdout.write("\u001b[?25h");
      stdin.setRawMode(wasRaw);
      stdin.pause();
    };

    // A hidden cursor and a raw terminal outlive the process, so they must be handed back even
    // when the run ends somewhere other than `finish`.
    process.once("exit", restore);

    const abort = () => {
      restore();
      // 130 is the conventional "terminated by SIGINT" status. Re-raising the signal instead
      // would let Node's default handler exit without unwinding through the restore above.
      process.exit(130);
    };

    try {
      cleanup = run((value) => {
        restore();
        resolve(value);
      }, abort);
    } catch (error) {
      restore();
      reject(error);
    }
  });
}

type Key = "up" | "down" | "space" | "enter" | "abort" | "all" | "none" | "other";

/** Maps a raw keypress chunk to the one action it means, ignoring anything unrecognised. */
function readKey(chunk: Buffer): Key {
  const sequence = chunk.toString("utf8");

  switch (sequence) {
    case "\u001b[A":
    case "k":
      return "up";
    case "\u001b[B":
    case "j":
      return "down";
    case " ":
      return "space";
    case "\r":
    case "\n":
      return "enter";
    case "\u0003":
    case "\u001b":
      return "abort";
    case "a":
      return "all";
    case "n":
      return "none";
    default:
      return "other";
  }
}

interface ListState {
  cursor: number;
  selected: Set<number>;
}

/** Rows reserved for the prompt header, the guide line and the position line. */
const LIST_CHROME_ROWS = 6;
const MIN_VIEWPORT_ROWS = 3;

/**
 * How many options fit on screen at once.
 *
 * Redrawing works by moving the cursor up over the previous frame, which cannot reach past the
 * top of the screen — a list taller than the terminal would smear itself across the scrollback.
 */
function viewportSize(streams: Streams, total: number): number {
  // `total` clamps last: a floor larger than the list would index past its end.
  return Math.min(total, Math.max(MIN_VIEWPORT_ROWS, streams.style.rows - LIST_CHROME_ROWS));
}

/** First visible index, chosen so the cursor stays inside the window. */
function windowStart(cursor: number, total: number, size: number): number {
  if (total <= size) {
    return 0;
  }

  // Centre the cursor, then clamp so the window never runs off either end.
  return Math.max(0, Math.min(cursor - Math.floor(size / 2), total - size));
}

function renderList<T>(
  streams: Streams,
  options: PromptOption<T>[],
  state: ListState,
  multi: boolean,
  previousLines: number,
): number {
  const { stdout, style } = streams;

  if (previousLines > 0) {
    stdout.write(`\u001b[${previousLines}A`);
  }

  const size = viewportSize(streams, options.length);
  const start = windowStart(state.cursor, options.length, size);

  for (let offset = 0; offset < size; offset += 1) {
    const index = start + offset;
    const option = options[index];
    const active = index === state.cursor;
    const pointer = active ? style.paint(ANSI.cyan, style.icon("cursor")) : " ";
    const marker = multi
      ? `${state.selected.has(index) ? style.paint(ANSI.green, style.icon("on")) : style.dim(style.icon("off"))} `
      : "";
    const label = active ? style.paint(ANSI.cyan, option.label) : option.label;
    stdout.write(`\u001b[2K  ${pointer} ${marker}${label}\n`);
  }

  // A constant line count keeps the cursor-up arithmetic simple on the next frame, so the
  // position line is drawn even when the whole list is visible.
  const position =
    options.length > size
      ? `${start + 1}\u2013${start + size} of ${options.length}`
      : `${options.length} ${options.length === 1 ? "option" : "options"}`;
  stdout.write(`\u001b[2K  ${style.dim(position)}\n`);

  return size + 1;
}

async function selectFromList<T>(
  streams: Streams,
  options: PromptOption<T>[],
  config: { multi: boolean; initialCursor: number; initialSelected: number[]; allowEmpty: boolean },
): Promise<number[]> {
  const state: ListState = {
    cursor: config.initialCursor,
    selected: new Set(config.initialSelected),
  };

  printGuide(
    streams,
    config.multi ? "↑↓ move · space toggle · a all · n none · enter confirm" : "↑↓ move · enter confirm",
  );

  let rendered = renderList(streams, options, state, config.multi, 0);

  return withRawMode<number[]>(streams, (finish, abort) => {
    const onData = (chunk: Buffer) => {
      const key = readKey(chunk);

      if (key === "abort") {
        abort();
        return;
      }

      if (key === "up") {
        state.cursor = (state.cursor - 1 + options.length) % options.length;
      } else if (key === "down") {
        state.cursor = (state.cursor + 1) % options.length;
      } else if (config.multi && key === "space") {
        if (state.selected.has(state.cursor)) {
          state.selected.delete(state.cursor);
        } else {
          state.selected.add(state.cursor);
        }
      } else if (config.multi && key === "all") {
        for (let index = 0; index < options.length; index += 1) {
          state.selected.add(index);
        }
      } else if (config.multi && key === "none") {
        state.selected.clear();
      } else if (key === "enter") {
        const chosen = config.multi ? [...state.selected].sort((left, right) => left - right) : [state.cursor];
        if (chosen.length === 0 && !config.allowEmpty) {
          // Nothing to confirm yet; keep the list up instead of failing the command.
          return;
        }
        finish(chosen);
        return;
      } else {
        return;
      }

      rendered = renderList(streams, options, state, config.multi, rendered);
    };

    streams.stdin.on("data", onData);
    return () => streams.stdin.off("data", onData);
  });
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

  const streams = ensureInteractive(runtime);
  printHeader(streams, message);

  const rl = createInterface({ input: streams.stdin, output: streams.stdout });
  try {
    // Re-ask rather than failing the whole command on an empty answer; a typo at the last prompt
    // of a scaffold used to discard every answer before it.
    for (;;) {
      const suffix = defaultValue !== undefined ? streams.style.dim(` (${defaultValue})`) : "";
      const answer = (await rl.question(`  ${streams.style.icon("cursor")}${suffix} `)).trim();

      if (answer.length > 0) {
        return answer;
      }

      if (defaultValue !== undefined) {
        return defaultValue;
      }

      if (!required) {
        return "";
      }

      printGuide(streams, "A value is required.");
    }
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

  const streams = ensureInteractive(runtime);
  printHeader(streams, message);

  const rl = createInterface({ input: streams.stdin, output: streams.stdout });
  try {
    const hint = defaultValue ? "Y/n" : "y/N";
    for (;;) {
      const answer = (await rl.question(`  ${streams.style.icon("cursor")} ${streams.style.dim(`(${hint})`)} `))
        .trim()
        .toLowerCase();

      if (answer.length === 0) {
        return defaultValue;
      }

      if (answer === "y" || answer === "yes") {
        return true;
      }

      if (answer === "n" || answer === "no") {
        return false;
      }

      printGuide(streams, `Answer y or n, or press enter for ${defaultValue ? "yes" : "no"}.`);
    }
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

  const streams = ensureInteractive(runtime);
  printHeader(streams, message);

  const [index] = await selectFromList(streams, options, {
    multi: false,
    initialCursor: defaultIndex,
    initialSelected: [],
    allowEmpty: false,
  });

  return options[index].value;
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

  const streams = ensureInteractive(runtime);
  printHeader(streams, message);

  const indices = await selectFromList(streams, options, {
    multi: true,
    initialCursor: defaultIndices[0] ?? 0,
    initialSelected: defaultIndices,
    allowEmpty,
  });

  return indices.map((index) => options[index].value);
}
