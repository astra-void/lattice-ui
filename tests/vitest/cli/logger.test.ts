import { PassThrough } from "node:stream";
import { describe, expect, it } from "vitest";
import { createLogger } from "../../../packages/tools/cli/src/core/logger";
import { hyperlink } from "../../../packages/tools/cli/src/core/style";

const ESC = "\u001b";

function createReadStream(isTTY: boolean) {
  const stream = new PassThrough();
  (stream as unknown as { isTTY: boolean }).isTTY = isTTY;
  return stream as unknown as NodeJS.ReadStream;
}

interface Harness {
  logger: ReturnType<typeof createLogger>;
  /** Everything written to stdout so far. Safe to call repeatedly. */
  stdout(): string;
  stderr(): string;
  /** stdout with colour and hyperlink escapes removed, as the reader would see it. */
  plain(): string;
  /** Advances the injected clock, in milliseconds. */
  advance(milliseconds: number): void;
}

function createLoggerFor(isTTY: boolean, env: NodeJS.ProcessEnv = {}): Harness {
  const stdoutRaw = new PassThrough();
  const stderrRaw = new PassThrough();
  (stdoutRaw as unknown as { isTTY: boolean }).isTTY = isTTY;
  (stderrRaw as unknown as { isTTY: boolean }).isTTY = isTTY;

  let out = "";
  let err = "";
  stdoutRaw.on("data", (chunk: Buffer) => {
    out += chunk.toString("utf8");
  });
  stderrRaw.on("data", (chunk: Buffer) => {
    err += chunk.toString("utf8");
  });

  let clock = 0;

  const logger = createLogger({
    verbose: false,
    yes: true,
    env,
    now: () => clock,
    stdin: createReadStream(isTTY),
    stdout: stdoutRaw as unknown as NodeJS.WriteStream,
    stderr: stderrRaw as unknown as NodeJS.WriteStream,
  });

  const strip = (text: string) =>
    text
      .replace(new RegExp(`${ESC}\\]8;;.*?\u0007`, "g"), "")
      .replace(new RegExp(`${ESC}\\[[0-9;?]*[A-Za-z]`, "g"), "");

  return {
    logger,
    stdout: () => out,
    stderr: () => err,
    plain: () => strip(out),
    advance: (milliseconds: number) => {
      clock += milliseconds;
    },
  };
}

describe("logger rail layout", () => {
  it("threads a run through one continuous gutter in a terminal", () => {
    const harness = createLoggerFor(true);

    harness.logger.header("lattice add", "dry run");
    harness.logger.fields([["Project", "~/demo"]]);
    harness.logger.group("2 packages", ["one", "two"]);
    harness.logger.command("npm add one two");
    harness.logger.outcome("Done");

    expect(harness.plain()).toBe(
      [
        "┌  lattice add   dry run",
        "│",
        "│  Project  ~/demo",
        "│",
        "◇  2 packages",
        "│  ├ one",
        "│  └ two",
        "│",
        "│  › npm add one two",
        "│",
        "└  Done   0ms",
        "",
      ].join("\n"),
    );
  });

  it("marks a warning block with its own node and colour", () => {
    const harness = createLoggerFor(true);

    harness.logger.header("lattice doctor");
    harness.logger.group("2 warnings", ["one", "two"], { tone: "warn" });

    expect(harness.plain()).toContain("▲  2 warnings");
    // Yellow marks the node itself, not the rows under it.
    expect(harness.stdout()).toContain(`${ESC}[33m▲`);
  });

  it("detaches the trailing commands once the rail has closed", () => {
    const harness = createLoggerFor(true);

    harness.logger.header("lattice add");
    harness.logger.outcome("Done");
    harness.logger.next(["npx lattice-ui doctor"]);

    const lines = harness.plain().trimEnd().split("\n");
    // A blank line, not another gutter segment: the rail already ended at `└`.
    expect(lines.at(-3)).toBe("└  Done   0ms");
    expect(lines.at(-2)).toBe("");
    expect(lines.at(-1)).toBe("   › npx lattice-ui doctor");
  });

  it("collapses the gutter to plain indentation outside a terminal", () => {
    const harness = createLoggerFor(false);

    harness.logger.header("lattice doctor");
    harness.logger.fields([["Warnings", "2"]]);
    harness.logger.group("2 warnings", ["one"], { tone: "warn" });
    harness.logger.outcome("Done");

    const text = harness.stdout();
    expect(text).not.toContain(ESC);
    expect(text).not.toContain("│");
    expect(text).toContain("  Warnings  2");
    expect(text).toContain("[!]  2 warnings");
    expect(text).toContain("  - one");
    expect(text).toContain("[+] Done");
  });
});

describe("logger alignment", () => {
  it("aligns field labels against each other", () => {
    const harness = createLoggerFor(false);

    harness.logger.fields([
      ["Project", "/tmp/demo"],
      ["Manager", "npm"],
      ["Components", "dialog"],
    ]);

    const lines = harness.stdout().split("\n").filter(Boolean);
    expect(lines[0].indexOf("/tmp/demo")).toBe(lines[1].indexOf("npm"));
    expect(lines[1].indexOf("npm")).toBe(lines[2].indexOf("dialog"));
  });

  it("measures hyperlinked values by their visible width, not their byte length", () => {
    const harness = createLoggerFor(true);

    harness.logger.group("Notes", [
      [hyperlink("dialog", "https://example.com/a"), "first"],
      ["toggle-group", "second"],
    ]);

    const lines = harness
      .plain()
      .split("\n")
      .filter((line) => line.includes("first") || line.includes("second"));
    // Without display-width padding the escape bytes would push "first" left by ~40 columns.
    expect(lines[0].indexOf("first")).toBe(lines[1].indexOf("second"));
  });

  it("collapses a long group into a remainder line", () => {
    const harness = createLoggerFor(true);

    harness.logger.group("Packages", ["a", "b", "c", "d"], { limit: 2 });

    expect(harness.plain().split("\n").filter(Boolean)).toEqual([
      "◇  Packages",
      "│  ├ a",
      // The remainder line takes the closing branch, so `b` stays a mid branch.
      "│  ├ b",
      "│  └ …and 2 more",
    ]);
  });
});

describe("logger capabilities", () => {
  it("reports elapsed time on the closing line", () => {
    const harness = createLoggerFor(true);

    harness.logger.header("lattice add");
    harness.advance(1234);
    harness.logger.outcome("Done");

    expect(harness.plain()).toContain("1.2s");
  });

  it("reports sub-second runs in milliseconds", () => {
    const harness = createLoggerFor(true);

    harness.logger.header("lattice add");
    harness.advance(412);
    harness.logger.outcome("Done");

    expect(harness.plain()).toContain("412ms");
  });

  it("keeps hyperlinks in a terminal and drops them elsewhere", () => {
    const linked = hyperlink("demo", "file:///tmp/demo");

    const terminal = createLoggerFor(true);
    terminal.logger.fields([["Project", linked]]);
    expect(terminal.stdout()).toContain(`${ESC}]8;;file:///tmp/demo`);

    const piped = createLoggerFor(false);
    piped.logger.fields([["Project", linked]]);
    // The label survives; only the escape wrapper is dropped.
    expect(piped.stdout()).not.toContain(`${ESC}]8;;`);
    expect(piped.stdout()).toContain("demo");
  });

  it("honors NO_COLOR over FORCE_COLOR", () => {
    const forced = createLoggerFor(false, { FORCE_COLOR: "1" });
    forced.logger.outcome("Done");
    expect(forced.stdout()).toContain(ESC);

    const disabled = createLoggerFor(true, { NO_COLOR: "1", FORCE_COLOR: "1" });
    disabled.logger.outcome("Done");
    expect(disabled.stdout()).not.toContain(`${ESC}[3`);
  });

  it("never opens with a blank line", () => {
    const harness = createLoggerFor(true);

    harness.logger.header("lattice add");
    harness.logger.outcome("Done");

    expect(harness.plain().startsWith("┌")).toBe(true);
  });
});
