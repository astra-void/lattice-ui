import { describe, expect, it } from "vitest";
import type { CliError } from "../../../packages/tools/cli/src/core/errors";
import { runProcess } from "../../../packages/tools/cli/src/core/pm/run";

const NODE = process.execPath;

async function expectFailure(script: string): Promise<CliError> {
  try {
    await runProcess(NODE, ["-e", script], { cwd: process.cwd(), stream: false });
  } catch (error) {
    return error as CliError;
  }

  throw new Error("Expected the process to fail.");
}

describe("runProcess", () => {
  it("resolves when the command succeeds", async () => {
    await expect(
      runProcess(NODE, ["-e", "process.exit(0)"], { cwd: process.cwd(), stream: false }),
    ).resolves.toBeUndefined();
  });

  it("reports the exit code", async () => {
    const error = await expectFailure("process.exit(3)");

    expect(error.message).toMatch(/exited with code 3/);
    expect(error.kind).toBe("PackageManagerFailed");
  });

  it("surfaces the captured output on failure", async () => {
    // Buffering must not swallow the diagnosis: a failed install is the one time the package
    // manager's own output is the only thing that explains what happened.
    const error = await expectFailure("console.error('ERR! missing peer foo'); process.exit(1)");

    expect(error.hints).toContain("ERR! missing peer foo");
  });

  it("captures stdout as well as stderr", async () => {
    const error = await expectFailure("console.log('written to stdout'); process.exit(1)");

    expect(error.hints).toContain("written to stdout");
  });

  it("keeps only the tail of a long failure log", async () => {
    const error = await expectFailure(
      "for (let i = 0; i < 100; i += 1) console.error('line ' + i); process.exit(1)",
    );

    expect(error.hints).toHaveLength(12);
    expect(error.hints.at(-1)).toBe("line 99");
    expect(error.hints).not.toContain("line 0");
  });

  it("drops blank lines from the captured tail", async () => {
    const error = await expectFailure("console.error('\\n\\nreal message\\n\\n'); process.exit(1)");

    expect(error.hints).toEqual(["real message"]);
  });

  it("rejects when the command cannot be spawned at all", async () => {
    await expect(
      runProcess("lattice-no-such-binary", [], { cwd: process.cwd(), stream: false }),
    ).rejects.toThrow(/Failed to run lattice-no-such-binary/);
  });
});
