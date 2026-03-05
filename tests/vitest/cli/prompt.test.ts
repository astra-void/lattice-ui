import { PassThrough } from "node:stream";
import { describe, expect, it } from "vitest";
import { promptConfirm, promptMultiSelect, promptSelect } from "../../../packages/cli/src/core/prompt";

function createPromptRuntime(input: string, isTTY: boolean) {
  const stdin = new PassThrough();
  const stdout = new PassThrough();
  (stdin as unknown as { isTTY: boolean }).isTTY = isTTY;
  (stdout as unknown as { isTTY: boolean }).isTTY = isTTY;

  stdin.end(input);

  return {
    runtime: {
      yes: false,
      stdin: stdin as unknown as NodeJS.ReadStream,
      stdout: stdout as unknown as NodeJS.WriteStream,
    },
    stdout,
  };
}

function readOutput(stream: PassThrough): string {
  return stream.read()?.toString("utf8") ?? "";
}

describe("prompt output formatting", () => {
  it("renders select prompt with styled guidance", async () => {
    const { runtime, stdout } = createPromptRuntime("\n", true);

    const value = await promptSelect(runtime, "Pick package manager", [
      { label: "npm", value: "npm" },
      { label: "pnpm", value: "pnpm" },
    ]);

    const output = readOutput(stdout);
    expect(value).toBe("npm");
    expect(output).toContain("?");
    expect(output).toContain("›");
    expect(output).toContain("1) npm");
    expect(output).toContain("2) pnpm");
  });

  it("renders confirm prompt and parses answer", async () => {
    const { runtime, stdout } = createPromptRuntime("y\n", true);

    const confirmed = await promptConfirm(runtime, "Initialize git", { defaultValue: false });

    const output = readOutput(stdout);
    expect(confirmed).toBe(true);
    expect(output).toContain("?");
    expect(output).toContain("Initialize git");
    expect(output).toContain("Confirm (y/N)");
  });

  it("renders multi-select prompt with defaults", async () => {
    const { runtime, stdout } = createPromptRuntime("\n", true);

    const values = await promptMultiSelect(
      runtime,
      "Pick components",
      [
        { label: "dialog", value: "dialog" },
        { label: "toast", value: "toast" },
      ],
      {
        defaultIndices: [0, 1],
      },
    );

    const output = readOutput(stdout);
    expect(values).toEqual(["dialog", "toast"]);
    expect(output).toContain("default: 1,2");
    expect(output).toContain("Enter comma-separated numbers");
  });

  it("throws without TTY", async () => {
    const { runtime } = createPromptRuntime("\n", false);

    await expect(
      promptSelect(runtime, "Pick one", [
        { label: "a", value: "a" },
        { label: "b", value: "b" },
      ]),
    ).rejects.toThrow(/require a TTY/i);
  });
});
