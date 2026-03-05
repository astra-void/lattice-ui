import { promises as fs } from "node:fs";
import * as path from "node:path";

async function hasPackageJson(dirPath: string): Promise<boolean> {
  try {
    await fs.access(path.join(dirPath, "package.json"));
    return true;
  } catch {
    return false;
  }
}

export async function findRoot(startDir: string): Promise<string | undefined> {
  let currentDir = path.resolve(startDir);

  while (true) {
    if (await hasPackageJson(currentDir)) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return undefined;
    }

    currentDir = parentDir;
  }
}
