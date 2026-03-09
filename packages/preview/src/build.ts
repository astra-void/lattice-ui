import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  transformPreviewSource,
  type UnsupportedPatternCode,
  type UnsupportedPatternError,
} from "@lattice-ui/compiler";
import { createErrorWithCause } from "./errorWithCause";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

function isTransformableSourceFile(fileName: string) {
  return SOURCE_EXTENSIONS.has(path.extname(fileName)) && !fileName.endsWith(".d.ts") && !fileName.endsWith(".d.tsx");
}

export type PreviewBuildTarget = {
  name: string;
  sourceRoot: string;
};

export type { UnsupportedPatternCode, UnsupportedPatternError };

export type BuildPreviewModulesOptions = {
  targets: PreviewBuildTarget[];
  outDir?: string;
  runtimeModule?: string;
  failOnUnsupported?: boolean;
};

export type BuildPreviewModulesResult = {
  outDir: string;
  writtenFiles: string[];
};

export class PreviewBuildError extends Error {
  readonly errors: UnsupportedPatternError[];

  constructor(errors: UnsupportedPatternError[]) {
    super(`Preview generation failed with ${errors.length} unsupported pattern(s).`);
    this.errors = errors;
    this.name = "PreviewBuildError";
  }
}

type PreviewBuildManifest = {
  files: Record<
    string,
    {
      hash: string;
      sourceFilePath: string;
    }
  >;
  version: 1;
};

const BUILD_MANIFEST_FILE = ".lattice-preview-manifest.json";

function listSourceFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listSourceFiles(entryPath));
      continue;
    }

    if (isTransformableSourceFile(entry.name)) {
      files.push(entryPath);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function hashText(value: string) {
  return createHash("sha1").update(value).digest("hex");
}

function transformPreviewSourceOrThrow(sourceText: string, options: Parameters<typeof transformPreviewSource>[1]) {
  try {
    return transformPreviewSource(sourceText, options);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw createErrorWithCause(`Failed to parse preview source ${options.filePath}: ${detail}`, error);
  }
}

function isPathEqualOrContained(rootPath: string, candidatePath: string) {
  const normalizedRoot = path.resolve(rootPath);
  const normalizedCandidate = path.resolve(candidatePath);
  return (
    normalizedRoot === normalizedCandidate ||
    normalizedCandidate.startsWith(`${normalizedRoot}${path.sep}`) ||
    normalizedRoot.startsWith(`${normalizedCandidate}${path.sep}`)
  );
}

function validateOutDir(outDir: string, targets: PreviewBuildTarget[]) {
  const resolvedOutDir = path.resolve(outDir);
  const parsedOutDir = path.parse(resolvedOutDir);
  if (resolvedOutDir === parsedOutDir.root) {
    throw new Error(`Preview output directory is too broad: ${resolvedOutDir}`);
  }

  for (const target of targets) {
    const targetOutputRoot = path.join(resolvedOutDir, target.name);
    if (isPathEqualOrContained(path.resolve(target.sourceRoot), targetOutputRoot)) {
      throw new Error(`Preview output directory overlaps the source tree for target ${target.name}: ${targetOutputRoot}`);
    }
  }
}

function validateTargetName(targetName: string) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(targetName) || targetName === "." || targetName === "..") {
    throw new Error(`Preview target name must be a safe path segment: ${targetName}`);
  }
}

function validateTarget(target: PreviewBuildTarget) {
  if (target.name.trim().length === 0) {
    throw new Error("Preview target names must be non-empty.");
  }

  validateTargetName(target.name);

  if (!fs.existsSync(target.sourceRoot) || !fs.statSync(target.sourceRoot).isDirectory()) {
    throw new Error(`Preview source directory does not exist: ${target.sourceRoot}`);
  }

  const hasEntry =
    fs.existsSync(path.join(target.sourceRoot, "index.ts")) || fs.existsSync(path.join(target.sourceRoot, "index.tsx"));
  if (!hasEntry) {
    throw new Error(`Preview source directory must contain index.ts or index.tsx: ${target.sourceRoot}`);
  }
}

function readBuildManifest(outDir: string): PreviewBuildManifest {
  const manifestPath = path.join(outDir, BUILD_MANIFEST_FILE);
  if (!fs.existsSync(manifestPath)) {
    return {
      files: {},
      version: 1,
    };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as PreviewBuildManifest;
    if (parsed.version === 1 && parsed.files && typeof parsed.files === "object") {
      return parsed;
    }
  } catch {
    // Fall back to a fresh manifest when the existing file is invalid.
  }

  return {
    files: {},
    version: 1,
  };
}

function removeEmptyParentDirectories(rootDir: string, filePath: string) {
  let currentDir = path.dirname(filePath);
  while (currentDir.startsWith(rootDir) && currentDir !== rootDir) {
    const entries = fs.existsSync(currentDir) ? fs.readdirSync(currentDir) : [];
    if (entries.length > 0) {
      return;
    }

    fs.rmdirSync(currentDir);
    currentDir = path.dirname(currentDir);
  }
}

export async function buildPreviewModules(options: BuildPreviewModulesOptions): Promise<BuildPreviewModulesResult> {
  const outDir = options.outDir ?? path.resolve(process.cwd(), "generated");
  const runtimeModule = options.runtimeModule ?? "@lattice-ui/preview-runtime";
  const failOnUnsupported = options.failOnUnsupported ?? true;

  if (options.targets.length === 0) {
    throw new Error("Preview generation requires at least one target.");
  }

  validateOutDir(outDir, options.targets);

  const pendingWrites = new Map<
    string,
    {
      code: string;
      hash: string;
      sourceFilePath: string;
    }
  >();
  const errors: UnsupportedPatternError[] = [];

  for (const target of options.targets) {
    validateTarget(target);
    const sourceRoot = path.resolve(target.sourceRoot);
    const sourceFiles = listSourceFiles(sourceRoot);

    for (const sourceFile of sourceFiles) {
      const sourceText = fs.readFileSync(sourceFile, "utf8");
      const transformResult = transformPreviewSourceOrThrow(sourceText, {
        filePath: sourceFile,
        runtimeModule,
        target: target.name,
      });

      if (transformResult.errors.length > 0) {
        errors.push(...transformResult.errors);
      }

      const relativePath = path.relative(sourceRoot, sourceFile);
      const destinationPath = path.join(outDir, target.name, relativePath);
      pendingWrites.set(destinationPath, {
        code: transformResult.code,
        hash: hashText(transformResult.code),
        sourceFilePath: sourceFile,
      });
    }
  }

  if (errors.length > 0 && failOnUnsupported) {
    throw new PreviewBuildError(errors);
  }

  fs.mkdirSync(outDir, { recursive: true });
  const previousManifest = readBuildManifest(outDir);
  const nextManifest: PreviewBuildManifest = {
    files: {},
    version: 1,
  };

  const writtenFiles: string[] = [];

  for (const [destinationPath, output] of pendingWrites.entries()) {
    const relativeDestinationPath = path.relative(outDir, destinationPath).split(path.sep).join("/");
    nextManifest.files[relativeDestinationPath] = {
      hash: output.hash,
      sourceFilePath: output.sourceFilePath,
    };

    const previousEntry = previousManifest.files[relativeDestinationPath];
    if (previousEntry?.hash === output.hash && fs.existsSync(destinationPath)) {
      continue;
    }

    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.writeFileSync(destinationPath, output.code, "utf8");
    writtenFiles.push(destinationPath);
  }

  for (const relativeDestinationPath of Object.keys(previousManifest.files)) {
    if (relativeDestinationPath in nextManifest.files) {
      continue;
    }

    const absoluteDestinationPath = path.join(outDir, relativeDestinationPath);
    if (!fs.existsSync(absoluteDestinationPath)) {
      continue;
    }

    fs.rmSync(absoluteDestinationPath, { force: true });
    removeEmptyParentDirectories(outDir, absoluteDestinationPath);
  }

  fs.writeFileSync(path.join(outDir, BUILD_MANIFEST_FILE), JSON.stringify(nextManifest, null, 2), "utf8");
  writtenFiles.sort((left, right) => left.localeCompare(right));

  return {
    outDir,
    writtenFiles,
  };
}
