import fs from "node:fs";
import path from "node:path";
import { usageError, validationError } from "../core/errors";

export type PreviewTargetSpec = {
  name: string;
  sourceRoot: string;
};

const TARGET_NAME_PATTERN = /^[a-z0-9][a-z0-9-_]*$/;

export function resolvePreviewEntryFile(sourceRoot: string) {
  const candidates = [path.join(sourceRoot, "index.ts"), path.join(sourceRoot, "index.tsx")];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

export function parseTargetSpec(value: string, cwd: string): PreviewTargetSpec {
  const separatorIndex = value.indexOf("=");
  if (separatorIndex <= 0 || separatorIndex === value.length - 1) {
    throw usageError(`Invalid --target value: ${value}. Expected <name=srcDir>.`);
  }

  const name = value.slice(0, separatorIndex).trim();
  const sourceRoot = value.slice(separatorIndex + 1).trim();

  if (!TARGET_NAME_PATTERN.test(name)) {
    throw usageError(`Invalid preview target name: ${name}. Use lowercase letters, numbers, dashes, or underscores.`);
  }

  return {
    name,
    sourceRoot: path.resolve(cwd, sourceRoot),
  };
}

export function ensureUniqueTargetNames(targets: PreviewTargetSpec[]) {
  const seen = new Set<string>();

  for (const target of targets) {
    if (seen.has(target.name)) {
      throw usageError(`Duplicate preview target name: ${target.name}`);
    }

    seen.add(target.name);
  }
}

export function validatePreviewTargets(targets: PreviewTargetSpec[]) {
  for (const target of targets) {
    if (!fs.existsSync(target.sourceRoot)) {
      throw validationError(`Preview source directory does not exist: ${target.sourceRoot}`);
    }

    if (!fs.statSync(target.sourceRoot).isDirectory()) {
      throw validationError(`Preview source path must be a directory: ${target.sourceRoot}`);
    }

    if (!resolvePreviewEntryFile(target.sourceRoot)) {
      throw validationError(`Preview source directory must contain index.ts or index.tsx: ${target.sourceRoot}`);
    }
  }
}
