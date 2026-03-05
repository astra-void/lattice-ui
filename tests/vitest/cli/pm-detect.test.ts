import { mkdtemp, rm, writeFile } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
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

    const result = await detectPackageManager(dir);
    expect(result.name).toBe("pnpm");
    expect(result.lockfiles).toEqual(["pnpm", "yarn", "npm"]);
  });

  it("uses override when provided", async () => {
    const dir = await createTempDir();
    await writeFile(path.join(dir, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n", "utf8");

    const result = await detectPackageManager(dir, "npm");
    expect(result.name).toBe("npm");
  });

  it("falls back to npm when no lockfile exists", async () => {
    const dir = await createTempDir();

    const result = await detectPackageManager(dir);
    expect(result.name).toBe("npm");
    expect(result.lockfiles).toEqual([]);
  });
});
