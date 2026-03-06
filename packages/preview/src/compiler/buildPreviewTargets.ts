import fs from "node:fs";
import path from "node:path";
import { transformPreviewSource } from "./transformSource";
import {
  type BuildPreviewModulesOptions,
  type BuildPreviewModulesResult,
  PreviewBuildError,
  type PreviewBuildTarget,
  type UnsupportedPatternError,
} from "./types";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

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

    if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(entryPath);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
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
      const transformResult = transformPreviewSource(sourceText, {
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
