import fs from "node:fs";
import path from "node:path";
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

function transformPreviewSourceOrThrow(sourceText: string, options: Parameters<typeof transformPreviewSource>[1]) {
  try {
    return transformPreviewSource(sourceText, options);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw createErrorWithCause(`Failed to parse preview source ${options.filePath}: ${detail}`, error);
  }
}

function validateTarget(target: PreviewBuildTarget) {
  if (target.name.trim().length === 0) {
    throw new Error("Preview target names must be non-empty.");
  }

  if (!fs.existsSync(target.sourceRoot) || !fs.statSync(target.sourceRoot).isDirectory()) {
    throw new Error(`Preview source directory does not exist: ${target.sourceRoot}`);
  }

  const hasEntry =
    fs.existsSync(path.join(target.sourceRoot, "index.ts")) || fs.existsSync(path.join(target.sourceRoot, "index.tsx"));
  if (!hasEntry) {
    throw new Error(`Preview source directory must contain index.ts or index.tsx: ${target.sourceRoot}`);
  }
}

export async function buildPreviewModules(options: BuildPreviewModulesOptions): Promise<BuildPreviewModulesResult> {
  const outDir = options.outDir ?? path.resolve(process.cwd(), "generated");
  const runtimeModule = options.runtimeModule ?? "@lattice-ui/preview/runtime";
  const failOnUnsupported = options.failOnUnsupported ?? true;

  if (options.targets.length === 0) {
    throw new Error("Preview generation requires at least one target.");
  }

  const pendingWrites = new Map<string, string>();
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
      pendingWrites.set(destinationPath, transformResult.code);
    }
  }

  if (errors.length > 0 && failOnUnsupported) {
    throw new PreviewBuildError(errors);
  }

  for (const target of options.targets) {
    fs.rmSync(path.join(outDir, target.name), { recursive: true, force: true });
  }

  const writtenFiles: string[] = [];

  for (const [destinationPath, code] of pendingWrites.entries()) {
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.writeFileSync(destinationPath, code, "utf8");
    writtenFiles.push(destinationPath);
  }

  writtenFiles.sort((left, right) => left.localeCompare(right));

  return {
    outDir,
    writtenFiles,
  };
}
