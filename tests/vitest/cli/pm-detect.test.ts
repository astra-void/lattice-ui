import { mkdtemp, rm, writeFile } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { detectPackageManager } from "../../../packages/cli/src/core/pm/detect";

const tempDirs: string[] = [];

async function createTempDir() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "lattice-cli-pm-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("detectPackageManager", () => {
  it("prefers pnpm lockfile over yarn and npm", async () => {
    const dir = await createTempDir();
    await writeFile(path.join(dir, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n", "utf8");
    await writeFile(path.join(dir, "yarn.lock"), "# yarn\n", "utf8");
    await writeFile(path.join(dir, "package-lock.json"), "{}\n", "utf8");

    const result = await detectPackageManager(dir, undefined, {
      detectInstalledPackageManagersFn: async () => ["npm", "pnpm", "yarn"],
    });

    expect(result.name).toBe("pnpm");
    expect(result.lockfiles).toEqual(["pnpm", "yarn", "npm"]);
    expect(result.installed).toEqual(["npm", "pnpm", "yarn"]);
    expect(result.source).toBe("lockfile");
  });

  it("uses override when provided", async () => {
    const dir = await createTempDir();
    await writeFile(path.join(dir, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n", "utf8");

    const result = await detectPackageManager(dir, "npm", {
      detectInstalledPackageManagersFn: async () => ["npm", "pnpm"],
    });

    expect(result.name).toBe("npm");
    expect(result.source).toBe("override");
  });

  it("fails when the lockfile package manager is not installed", async () => {
    const dir = await createTempDir();
    await writeFile(path.join(dir, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n", "utf8");

    await expect(
      detectPackageManager(dir, undefined, {
        detectInstalledPackageManagersFn: async () => ["npm"],
      }),
    ).rejects.toThrow(/Detected pnpm from pnpm-lock\.yaml but pnpm is not installed/i);
  });

  it("selects the only installed package manager when no lockfile exists", async () => {
    const dir = await createTempDir();

    const result = await detectPackageManager(dir, undefined, {
      detectInstalledPackageManagersFn: async () => ["yarn"],
    });

    expect(result.name).toBe("yarn");
    expect(result.lockfiles).toEqual([]);
    expect(result.installed).toEqual(["yarn"]);
    expect(result.source).toBe("installed");
  });

  it("prompts when multiple package managers are installed in an interactive session", async () => {
    const dir = await createTempDir();
    const promptSelectFn = vi.fn(async () => "pnpm");

    const result = await detectPackageManager(dir, undefined, {
      runtime: {
        yes: false,
        stdin: { isTTY: true } as NodeJS.ReadStream,
        stdout: { isTTY: true } as NodeJS.WriteStream,
      },
      promptSelectFn,
      detectInstalledPackageManagersFn: async () => ["npm", "pnpm"],
    });

    expect(promptSelectFn).toHaveBeenCalledWith(
      {
        yes: false,
        stdin: { isTTY: true },
        stdout: { isTTY: true },
      },
      "Select a package manager",
      [
        { label: "npm", value: "npm" },
        { label: "pnpm", value: "pnpm" },
      ],
      { defaultIndex: 0 },
    );
    expect(result.name).toBe("pnpm");
    expect(result.source).toBe("prompt");
  });

  it("fails in --yes mode when multiple package managers are installed", async () => {
    const dir = await createTempDir();

    await expect(
      detectPackageManager(dir, undefined, {
        runtime: { yes: true },
        detectInstalledPackageManagersFn: async () => ["npm", "pnpm"],
      }),
    ).rejects.toThrow(/Multiple package managers are installed/i);
  });

  it("fails when no supported package manager is installed", async () => {
    const dir = await createTempDir();

    await expect(
      detectPackageManager(dir, undefined, {
        detectInstalledPackageManagersFn: async () => [],
      }),
    ).rejects.toThrow(/No supported package manager is installed/i);
  });
});
