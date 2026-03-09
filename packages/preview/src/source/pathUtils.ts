import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

function stripViteFsPrefix(filePath: string) {
  return filePath.startsWith("/@fs/") ? filePath.slice("/@fs".length) : filePath;
}

function normalizeComparablePath(filePath: string) {
  const slashNormalizedPath = filePath.replace(/\\/g, "/");
  return ts.sys.useCaseSensitiveFileNames ? slashNormalizedPath : slashNormalizedPath.toLowerCase();
}

export function stripFileIdDecorations(filePath: string) {
  const searchIndex = filePath.search(/[?#]/);
  return searchIndex === -1 ? filePath : filePath.slice(0, searchIndex);
}

export function resolveFilePath(filePath: string) {
  return path.resolve(stripViteFsPrefix(stripFileIdDecorations(filePath)));
}

export function resolveRealFilePath(filePath: string) {
  const resolvedPath = resolveFilePath(filePath);

  try {
    return fs.realpathSync.native?.(resolvedPath) ?? fs.realpathSync(resolvedPath);
  } catch {
    return resolvedPath;
  }
}

export function canonicalizeFilePath(filePath: string) {
  return normalizeComparablePath(resolveRealFilePath(filePath));
}

export function isFilePathUnderRoot(rootPath: string, filePath: string) {
  const canonicalRootPath = canonicalizeFilePath(rootPath);
  const canonicalFilePath = canonicalizeFilePath(filePath);

  if (canonicalFilePath === canonicalRootPath) {
    return false;
  }

  const rootPrefix = canonicalRootPath.endsWith("/") ? canonicalRootPath : `${canonicalRootPath}/`;
  return canonicalFilePath.startsWith(rootPrefix);
}
