import { describe, expect, it } from "vitest";
import { runCli } from "../../../packages/cli/src/cli";

describe("runCli", () => {
  it("prints migration guidance for init", async () => {
    await expect(runCli(["init"])).rejects.toThrow(/lattice create <project-path>/i);
  });

  it("rejects removed global options", async () => {
    await expect(runCli(["--cwd", "./apps/game", "doctor"])).rejects.toThrow(/Unknown global option/i);
  });

  it("requires create project path", async () => {
    await expect(runCli(["create"])).rejects.toThrow(/exactly one <project-path>/i);
  });
});
