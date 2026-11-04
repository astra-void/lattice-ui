import { describe, expect, it, vi } from "vitest";
import { runCli } from "../../../packages/tools/cli/src/cli";
import type { CliError } from "../../../packages/tools/cli/src/core/errors";
import * as ctxModule from "../../../packages/tools/cli/src/ctx";

async function captureStdout(run: () => Promise<void>): Promise<string> {
  let output = "";
  const write = process.stdout.write.bind(process.stdout);
  const spy = (chunk: string | Uint8Array) => {
    output += chunk.toString();
    return true;
  };

  process.stdout.write = spy as typeof process.stdout.write;
  try {
    await run();
  } finally {
    process.stdout.write = write;
  }

  return output;
}

async function captureHints(run: () => Promise<void>): Promise<string[]> {
  try {
    await run();
  } catch (error) {
    return (error as CliError).hints;
  }

  throw new Error("Expected the command to fail.");
}

describe("runCli", () => {
  it("rejects positional arguments for init", async () => {
    await expect(runCli(["init", "apps/game"])).rejects.toThrow(/does not accept positional arguments/i);
  });

  it("rejects removed global options", async () => {
    await expect(runCli(["--cwd", "./apps/game", "doctor"])).rejects.toThrow(/Unknown global option/i);
  });

  it("requires create project path when --yes is used", async () => {
    await expect(runCli(["create", "--yes"])).rejects.toThrow(/requires \[project-path\] when using --yes/i);
  });

  it("rejects conflicting lint flags for create", async () => {
    await expect(runCli(["create", "my-game", "--lint", "--no-lint"])).rejects.toThrow(
      /cannot use --lint and --no-lint together/i,
    );
  });

  it("requires remove selection in --yes mode", async () => {
    await expect(runCli(["remove", "--yes"])).rejects.toThrow(/when using --yes/i);
  });

  it("rejects unknown options for remove", async () => {
    await expect(runCli(["remove", "--bogus"])).rejects.toThrow(/unknown option for remove/i);
  });

  it("accepts -y as an alias for --yes", async () => {
    await expect(runCli(["remove", "-y"])).rejects.toThrow(/when using --yes/i);
  });

  it("accepts --yes and -y before the command name", async () => {
    // create checks --yes before probing package managers, so this stays fast.
    await expect(runCli(["--yes", "create"])).rejects.toThrow(/requires \[project-path\] when using --yes/i);
    await expect(runCli(["-y", "create"])).rejects.toThrow(/requires \[project-path\] when using --yes/i);
  });

  it("accepts --verbose before the command name", async () => {
    const createContextSpy = vi.spyOn(ctxModule, "createContext").mockRejectedValue(new Error("stop"));

    await expect(runCli(["--verbose", "-y", "doctor"])).rejects.toThrow("stop");

    expect(createContextSpy.mock.calls[0]?.[0]).toMatchObject({ verbose: true });
  });

  it("still reaches help and version after leading global options", async () => {
    const help = await captureStdout(() => runCli(["--verbose", "add", "--help"]));
    expect(help).toContain("lattice add [name...] [options]");

    const version = await captureStdout(() => runCli(["--verbose", "--version"]));
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("lists --verbose in every command's help", async () => {
    for (const command of ["create", "init", "add", "remove", "upgrade", "doctor"]) {
      const output = await captureStdout(() => runCli([command, "--help"]));
      expect(output).toContain("--verbose");
    }
  });

  it("prints command help for <command> --help instead of failing on the flag", async () => {
    const output = await captureStdout(() => runCli(["add", "--help"]));

    expect(output).toContain("lattice add [name...] [options]");
    expect(output).toContain("--preset <preset...>");
    // The registry listing is what makes components discoverable without running the command.
    expect(output).toContain("Components:");
    expect(output).toContain("dialog");
    expect(output).toContain("overlay (popover, tooltip, dialog, toast)");
  });

  it("treats `help <command>` the same as `<command> --help`", async () => {
    const viaSubcommand = await captureStdout(() => runCli(["help", "doctor"]));
    const viaFlag = await captureStdout(() => runCli(["doctor", "--help"]));

    expect(viaSubcommand).toBe(viaFlag);
    expect(viaSubcommand).toContain("lattice doctor [options]");
  });

  it("reaches help even when the rest of the command line is invalid", async () => {
    const output = await captureStdout(() => runCli(["add", "--bogus", "--help"]));

    expect(output).toContain("lattice add [name...] [options]");
  });

  it("suggests the closest command for a typo", async () => {
    const hints = await captureHints(() => runCli(["addd"]));

    expect(hints).toContain("Did you mean `add`?");
  });

  it("suggests the closest option for a typo", async () => {
    const hints = await captureHints(() => runCli(["add", "--presett", "overlay"]));

    expect(hints).toContain("Did you mean `--preset`?");
  });

  it("rejects an unknown component before resolving a package manager", async () => {
    const hints = await captureHints(() => runCli(["add", "dialogg"]));

    expect(hints).toContain("Did you mean `dialog`?");
  });

  it("suggests the closest preset for a typo", async () => {
    const hints = await captureHints(() => runCli(["add", "--preset", "overlayy"]));

    expect(hints).toContain("Did you mean `overlay`?");
  });

  it("prints help examples with local lattice command usage", async () => {
    const output = await captureStdout(() => runCli(["--help"]));

    expect(output).toContain("npx lattice-ui add dialog,toast --preset overlay");
    expect(output).toContain("npx lattice-ui remove dialog --dry-run");
    expect(output).toContain("npx lattice-ui upgrade --dry-run");
    expect(output).toContain("npx lattice-ui doctor");
    expect(output).toContain("npx lattice-ui create");
    expect(output).toContain("npx lattice-ui init --dry-run");
  });
});
