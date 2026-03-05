import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { findRoot } from "../../../packages/cli/src/core/project/findRoot";

const tempDirs: string[] = [];

async function createTempDir() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "lattice-cli-root-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("findRoot", () => {
  it("finds nearest parent with package.json", async () => {
    const root = await createTempDir();
    const nested = path.join(root, "a", "b", "c");

    await mkdir(nested, { recursive: true });
    await writeFile(path.join(root, "package.json"), "{}\n", "utf8");

    const resolved = await findRoot(nested);
    expect(resolved).toBe(root);
  });

  it("returns undefined when package.json is not found", async () => {
    const root = await createTempDir();
    const nested = path.join(root, "nested");

    await mkdir(nested, { recursive: true });

    const resolved = await findRoot(nested);
    expect(resolved).toBeUndefined();
  });
});
