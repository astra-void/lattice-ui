import { mkdtemp, rm, writeFile } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { detectPackageManager } from "../../../packages/tools/cli/src/core/pm/detect";
import { planPackageManagerPin, readPackageManagerPins } from "../../../packages/tools/cli/src/core/pm/devEngines";

const tempDirs: string[] = [];

async function createTempDir() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "lattice-cli-pin-"));
  tempDirs.push(dir);
  return dir;
}

async function writeManifest(dir: string, manifest: Record<string, unknown>) {
  await writeFile(path.join(dir, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

/** Shape written by `pnpm init` on pnpm 11. */
const pnpmInitManifest = {
  name: "pinned",
  version: "1.0.0",
  devEngines: {
    packageManager: {
      name: "pnpm",
      version: "^11.10.0",
      onFail: "download",
    },
  },
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("readPackageManagerPins", () => {
  it("reads devEngines and packageManager pins", () => {
    expect(readPackageManagerPins(pnpmInitManifest)).toEqual([{ name: "pnpm", field: "devEngines" }]);
    expect(readPackageManagerPins({ packageManager: "yarn@4.5.0" })).toEqual([
      { name: "yarn", field: "packageManager" },
    ]);
  });

  it("ignores unknown or malformed pins", () => {
    expect(readPackageManagerPins({})).toEqual([]);
    expect(readPackageManagerPins({ packageManager: "bun@1.2.0" })).toEqual([]);
    expect(readPackageManagerPins({ devEngines: { packageManager: "pnpm" } })).toEqual([]);
  });
});

describe("planPackageManagerPin", () => {
  it("repins devEngines at the target manager and drops the foreign version range", () => {
    const plan = planPackageManagerPin(pnpmInitManifest, "npm");

    expect(plan.changed).toBe(true);
    expect(plan.previous).toEqual([{ name: "pnpm", field: "devEngines" }]);
    expect(plan.nextManifest.devEngines).toEqual({
      packageManager: { name: "npm", onFail: "download" },
    });
  });

  it("drops a conflicting packageManager field", () => {
    const plan = planPackageManagerPin({ name: "pinned", packageManager: "pnpm@11.10.0" }, "npm");

    expect(plan.changed).toBe(true);
    expect(plan.nextManifest.packageManager).toBeUndefined();
  });

  it("leaves a matching pin untouched", () => {
    const plan = planPackageManagerPin(pnpmInitManifest, "pnpm");

    expect(plan.changed).toBe(false);
    expect(plan.nextManifest).toBe(pnpmInitManifest);
  });
});

describe("detectPackageManager with package manager pins", () => {
  it("resolves the pinned manager when no lockfile exists", async () => {
    const dir = await createTempDir();
    await writeManifest(dir, pnpmInitManifest);

    const result = await detectPackageManager(dir, undefined, {
      runtime: { yes: true },
      detectInstalledPackageManagersFn: async () => ["npm", "pnpm"],
    });

    expect(result.name).toBe("pnpm");
    expect(result.source).toBe("manifest");
    expect(result.pins).toEqual([{ name: "pnpm", field: "devEngines" }]);
  });

  it("keeps an explicit --pm override and still reports the conflicting pin", async () => {
    const dir = await createTempDir();
    await writeManifest(dir, pnpmInitManifest);

    const result = await detectPackageManager(dir, "npm", {
      detectInstalledPackageManagersFn: async () => ["npm", "pnpm"],
    });

    expect(result.name).toBe("npm");
    expect(result.source).toBe("override");
    expect(result.pins).toEqual([{ name: "pnpm", field: "devEngines" }]);
  });

  it("prefers a lockfile over the pin", async () => {
    const dir = await createTempDir();
    await writeManifest(dir, pnpmInitManifest);
    await writeFile(path.join(dir, "package-lock.json"), "{}\n", "utf8");

    const result = await detectPackageManager(dir, undefined, {
      detectInstalledPackageManagersFn: async () => ["npm", "pnpm"],
    });

    expect(result.name).toBe("npm");
    expect(result.source).toBe("lockfile");
  });

  it("fails with an actionable message when the pinned manager is missing", async () => {
    const dir = await createTempDir();
    await writeManifest(dir, pnpmInitManifest);

    await expect(
      detectPackageManager(dir, undefined, {
        detectInstalledPackageManagersFn: async () => ["npm"],
      }),
    ).rejects.toThrow(/package\.json pins this project to pnpm/i);
  });
});
