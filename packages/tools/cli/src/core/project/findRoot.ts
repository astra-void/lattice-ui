import { promises as fs } from "node:fs";
import * as path from "node:path";

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function hasPackageJson(dirPath: string): Promise<boolean> {
  return exists(path.join(dirPath, "package.json"));
}

/** pnpm declares workspaces in `pnpm-workspace.yaml`; npm and yarn in package.json `workspaces`. */
async function isWorkspaceRoot(dirPath: string): Promise<boolean> {
  if (await exists(path.join(dirPath, "pnpm-workspace.yaml"))) {
    return true;
  }

  try {
    const manifest = JSON.parse(await fs.readFile(path.join(dirPath, "package.json"), "utf8")) as {
      workspaces?: unknown;
    };
    const workspaces = manifest.workspaces;
    return (
      Array.isArray(workspaces) ||
      (typeof workspaces === "object" &&
        workspaces !== null &&
        Array.isArray((workspaces as { packages?: unknown }).packages))
    );
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

/**
 * The workspace root above a workspace member, where the shared lockfile lives.
 *
 * Only an ancestor that declares workspaces counts, so a stray lockfile in some unrelated parent
 * directory is never picked up, and the walk stops at the repository root (a `.git` entry).
 */
export async function findWorkspaceRoot(projectRoot: string): Promise<string | undefined> {
  let currentDir = path.resolve(projectRoot);

  while (true) {
    if (await exists(path.join(currentDir, ".git"))) {
      return undefined;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return undefined;
    }

    currentDir = parentDir;
    if (await isWorkspaceRoot(currentDir)) {
      return currentDir;
    }
  }
}
