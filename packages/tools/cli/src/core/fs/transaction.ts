import { promises as fs } from "node:fs";
import * as path from "node:path";

export interface FileSnapshot {
  absolutePath: string;
  existed: boolean;
  content?: string;
}

export interface DirectorySnapshot {
  absolutePath: string;
  existed: boolean;
}

/**
 * Captures the current state of the files a command is about to write, so a failure
 * partway through (most often the dependency install) can leave the project exactly as it
 * was instead of a half-applied scaffold that poisons the next run.
 */
export async function snapshotFiles(root: string, relativePaths: string[]): Promise<FileSnapshot[]> {
  return Promise.all(
    relativePaths.map(async (relativePath) => {
      const absolutePath = path.join(root, relativePath);

      try {
        return {
          absolutePath,
          existed: true,
          content: await fs.readFile(absolutePath, "utf8"),
        };
      } catch (error) {
        const nodeError = error as NodeJS.ErrnoException;
        if (nodeError.code !== "ENOENT") {
          throw error;
        }

        return { absolutePath, existed: false };
      }
    }),
  );
}

export async function snapshotDirectories(
  root: string,
  relativePaths: readonly string[],
): Promise<DirectorySnapshot[]> {
  return Promise.all(
    relativePaths.map(async (relativePath) => {
      const absolutePath = path.join(root, relativePath);

      try {
        await fs.access(absolutePath);
        return { absolutePath, existed: true };
      } catch {
        return { absolutePath, existed: false };
      }
    }),
  );
}

async function removeEmptyParents(filePath: string, root: string): Promise<void> {
  const normalizedRoot = path.resolve(root);
  let directory = path.dirname(path.resolve(filePath));

  while (directory.startsWith(normalizedRoot) && directory !== normalizedRoot) {
    try {
      await fs.rmdir(directory);
    } catch {
      return;
    }

    directory = path.dirname(directory);
  }
}

/** Restores every snapshot taken by {@link snapshotFiles}. Never throws. */
export async function restoreFiles(root: string, snapshots: FileSnapshot[]): Promise<number> {
  let restored = 0;

  for (const snapshot of snapshots) {
    try {
      if (snapshot.existed) {
        await fs.writeFile(snapshot.absolutePath, snapshot.content ?? "", "utf8");
      } else {
        await fs.rm(snapshot.absolutePath, { force: true });
        await removeEmptyParents(snapshot.absolutePath, root);
      }

      restored += 1;
    } catch {
      // A file we cannot restore must not mask the original failure.
    }
  }

  return restored;
}

/** Removes directories that did not exist before the command ran, deepest first. */
export async function restoreDirectories(root: string, snapshots: DirectorySnapshot[]): Promise<void> {
  const created = snapshots
    .filter((snapshot) => !snapshot.existed)
    .map((snapshot) => snapshot.absolutePath)
    .sort((left, right) => right.length - left.length);

  for (const absolutePath of created) {
    try {
      await fs.rm(absolutePath, { recursive: true, force: true });
      await removeEmptyParents(absolutePath, root);
    } catch {
      // Best effort only.
    }
  }
}
