import { PassThrough } from "node:stream";
import { describe, expect, it } from "vitest";
import {
  promptConfirm,
  promptInput,
  promptMultiSelect,
  promptSelect,
} from "../../../packages/tools/cli/src/core/prompt";

const KEY = {
  up: "\u001b[A",
  down: "\u001b[B",
  space: " ",
  enter: "\r",
} as const;

interface Harness {
  runtime: { yes: boolean; stdin: NodeJS.ReadStream; stdout: NodeJS.WriteStream };
  /** Feeds keypresses one at a time so each render settles before the next key. */
  press(...keys: string[]): Promise<void>;
  output(): string;
}

function createHarness(isTTY = true): Harness {
  const stdin = new PassThrough();
  const stdout = new PassThrough();
  (stdin as unknown as { isTTY: boolean }).isTTY = isTTY;
  (stdin as unknown as { isRaw: boolean }).isRaw = false;
  (stdin as unknown as { setRawMode: (value: boolean) => void }).setRawMode = () => {};
  (stdout as unknown as { isTTY: boolean }).isTTY = isTTY;

  let captured = "";
  stdout.on("data", (chunk: Buffer) => {
    captured += chunk.toString("utf8");
  });

  return {
    runtime: {
      yes: false,
      stdin: stdin as unknown as NodeJS.ReadStream,
      stdout: stdout as unknown as NodeJS.WriteStream,
    },
    async press(...keys: string[]) {
      for (const key of keys) {
        stdin.write(key);
        await new Promise((resolve) => setImmediate(resolve));
      }
    },
    output: () => captured,
  };
}

/** Strips ANSI so assertions read against what a user would see. */
function plain(text: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: matching ANSI escapes is the point
  return text.replace(/\u001b\[[0-9;?]*[A-Za-z]/g, "");
}

describe("promptSelect", () => {
  it("moves the cursor with arrow keys and confirms with enter", async () => {
    const harness = createHarness();

    const pending = promptSelect(harness.runtime, "Pick package manager", [
      { label: "npm", value: "npm" },
      { label: "pnpm", value: "pnpm" },
      { label: "yarn", value: "yarn" },
    ]);

    await harness.press(KEY.down, KEY.down, KEY.up, KEY.enter);

    expect(await pending).toBe("pnpm");
    const text = plain(harness.output());
    expect(text).toContain("Pick package manager");
    expect(text).toContain("↑↓ move · enter confirm");
  });

  it("wraps around the ends of the list", async () => {
    const harness = createHarness();

    const pending = promptSelect(harness.runtime, "Pick one", [
      { label: "a", value: "a" },
      { label: "b", value: "b" },
    ]);

    await harness.press(KEY.up, KEY.enter);

    expect(await pending).toBe("b");
  });

  it("returns the default without prompting in --yes mode", async () => {
    const value = await promptSelect(
      { yes: true },
      "Pick one",
      [
        { label: "a", value: "a" },
        { label: "b", value: "b" },
      ],
      { defaultIndex: 1 },
    );

    expect(value).toBe("b");
  });

  it("throws without a TTY", async () => {
    const harness = createHarness(false);

    await expect(
      promptSelect(harness.runtime, "Pick one", [
        { label: "a", value: "a" },
        { label: "b", value: "b" },
      ]),
    ).rejects.toThrow(/require a TTY/i);
  });
});

describe("promptMultiSelect", () => {
  it("toggles entries with space and confirms with enter", async () => {
    const harness = createHarness();

    const pending = promptMultiSelect(harness.runtime, "Pick components", [
      { label: "dialog", value: "dialog" },
      { label: "toast", value: "toast" },
      { label: "popover", value: "popover" },
    ]);

    await harness.press(KEY.space, KEY.down, KEY.down, KEY.space, KEY.enter);

    expect(await pending).toEqual(["dialog", "popover"]);
    expect(plain(harness.output())).toContain("space toggle");
  });

  it("selects and clears everything with a and n", async () => {
    const harness = createHarness();

    const pending = promptMultiSelect(harness.runtime, "Pick components", [
      { label: "dialog", value: "dialog" },
      { label: "toast", value: "toast" },
    ]);

    await harness.press("a", "n", "a", KEY.enter);

    expect(await pending).toEqual(["dialog", "toast"]);
  });

  it("starts from the provided defaults", async () => {
    const harness = createHarness();

    const pending = promptMultiSelect(
      harness.runtime,
      "Pick components",
      [
        { label: "dialog", value: "dialog" },
        { label: "toast", value: "toast" },
      ],
      { defaultIndices: [0, 1] },
    );

    await harness.press(KEY.enter);

    expect(await pending).toEqual(["dialog", "toast"]);
  });

  it("ignores enter on an empty selection when one is required", async () => {
    const harness = createHarness();

    const pending = promptMultiSelect(harness.runtime, "Pick components", [
      { label: "dialog", value: "dialog" },
      { label: "toast", value: "toast" },
    ]);

    // The first enter must not resolve the prompt, so the selection made after it still counts.
    await harness.press(KEY.enter, KEY.space, KEY.enter);

    expect(await pending).toEqual(["dialog"]);
  });

  it("allows an empty selection when the caller opts in", async () => {
    const harness = createHarness();

    const pending = promptMultiSelect(harness.runtime, "Pick presets", [{ label: "overlay", value: "overlay" }], {
      allowEmpty: true,
    });

    await harness.press(KEY.enter);

    expect(await pending).toEqual([]);
  });
});

describe("prompt viewport", () => {
  const options = Array.from({ length: 40 }, (_, index) => ({ label: `item-${index}`, value: index }));

  function createShortTerminal(rows: number) {
    const harness = createHarness();
    (harness.runtime.stdout as unknown as { rows: number }).rows = rows;
    return harness;
  }

  it("never draws more rows than the terminal can redraw over", async () => {
    // Redrawing moves the cursor up over the previous frame; a frame taller than the screen
    // cannot be reached, so the list has to window instead.
    const harness = createShortTerminal(20);
    const pending = promptSelect(harness.runtime, "Pick one", options);

    await harness.press(KEY.enter);
    await pending;

    const drawn = plain(harness.output())
      .split("\n")
      .filter((line) => line.includes("item-"));
    expect(drawn.length).toBeLessThanOrEqual(20);
    expect(drawn.length).toBeGreaterThan(0);
  });

  it("keeps the cursor inside the window while it moves", async () => {
    const harness = createShortTerminal(20);
    const pending = promptSelect(harness.runtime, "Pick one", options);

    await harness.press(...Array.from({ length: 25 }, () => KEY.down), KEY.enter);

    expect(await pending).toBe(25);
    const frames = plain(harness.output()).split("\n");
    // The selected row is on screen in the final frame, not scrolled past.
    expect(frames.some((line) => line.includes("❯") && line.includes("item-25"))).toBe(true);
  });

  it("reports the visible range when the list is windowed", async () => {
    const harness = createShortTerminal(20);
    const pending = promptSelect(harness.runtime, "Pick one", options);

    await harness.press(KEY.enter);
    await pending;

    expect(plain(harness.output())).toMatch(/1\u201314 of 40/);
  });

  it("reports a plain count when the whole list fits", async () => {
    const harness = createHarness();
    const pending = promptSelect(harness.runtime, "Pick one", [
      { label: "a", value: "a" },
      { label: "b", value: "b" },
    ]);

    await harness.press(KEY.enter);
    await pending;

    expect(plain(harness.output())).toContain("2 options");
  });

  it("renders a two-item list without indexing past its end", async () => {
    // The viewport floor must never exceed the option count.
    const harness = createShortTerminal(8);
    const pending = promptSelect(harness.runtime, "Pick one", [
      { label: "a", value: "a" },
      { label: "b", value: "b" },
    ]);

    await harness.press(KEY.down, KEY.enter);

    expect(await pending).toBe("b");
  });
});

describe("promptConfirm", () => {
  it("parses an answer", async () => {
    const harness = createHarness();
    const pending = promptConfirm(harness.runtime, "Initialize git", { defaultValue: false });

    await harness.press("y\n");

    expect(await pending).toBe(true);
    expect(plain(harness.output())).toContain("Initialize git");
  });

  it("falls back to the default on an empty answer", async () => {
    const harness = createHarness();
    const pending = promptConfirm(harness.runtime, "Set up lint", { defaultValue: true });

    await harness.press("\n");

    expect(await pending).toBe(true);
  });

  it("re-asks instead of failing on an unparseable answer", async () => {
    const harness = createHarness();
    const pending = promptConfirm(harness.runtime, "Initialize git", { defaultValue: false });

    await harness.press("maybe\n", "n\n");

    expect(await pending).toBe(false);
    expect(plain(harness.output())).toContain("Answer y or n");
  });
});

describe("promptInput", () => {
  it("re-asks instead of failing when a required value is empty", async () => {
    const harness = createHarness();
    const pending = promptInput(harness.runtime, "Project name", { required: true });

    await harness.press("\n", "my-game\n");

    expect(await pending).toBe("my-game");
    expect(plain(harness.output())).toContain("A value is required.");
  });

  it("uses the default when the answer is empty", async () => {
    const harness = createHarness();
    const pending = promptInput(harness.runtime, "Project name", { defaultValue: "lattice-app" });

    await harness.press("\n");

    expect(await pending).toBe("lattice-app");
  });
});
