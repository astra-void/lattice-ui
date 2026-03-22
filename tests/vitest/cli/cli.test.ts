import { describe, expect, it } from "vitest";
import { runCli } from "../../../packages/cli/src/cli";

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

  it("prints help examples with local lattice command usage", async () => {
    let output = "";
    const write = process.stdout.write.bind(process.stdout);
    const spy = (chunk: string | Uint8Array) => {
      output += chunk.toString();
      return true;
    };

    process.stdout.write = spy as typeof process.stdout.write;
    try {
      await runCli(["--help"]);
    } finally {
      process.stdout.write = write;
    }

    expect(output).toContain("npx @lattice-ui/cli add dialog,toast --preset overlay");
    expect(output).toContain("npx @lattice-ui/cli remove dialog --dry-run");
    expect(output).toContain("npx @lattice-ui/cli upgrade --dry-run");
    expect(output).toContain("npx @lattice-ui/cli doctor");
    expect(output).toContain("npx @lattice-ui/cli create");
    expect(output).toContain("npx @lattice-ui/cli init --dry-run");
  });
});
