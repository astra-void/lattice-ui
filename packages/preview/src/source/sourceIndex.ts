import { createHash } from "node:crypto";
import fs from "node:fs";
import { compile_tsx, transformPreviewSource } from "@lattice-ui/compiler";
import ts from "typescript";
import { createErrorWithCause } from "../errorWithCause";
import {
  analyzeSourceModule,
  createRegistryItem,
  isPreviewPackageInternalEntry,
  listSourceFiles,
  toRelativeSourcePath,
  type ParsedConfigCache,
  type SourceModuleRecord,
} from "./discover";
import { isFilePathUnderRoot, resolveRealFilePath, stripFileIdDecorations } from "./pathUtils";
import type {
  PreviewEntryMeta,
  PreviewRegistryDiagnostic,
  PreviewRegistryItem,
  PreviewSourceTarget,
  PreviewWorkspace,
} from "./types";

type IndexedPreviewTarget = PreviewSourceTarget & {
  packageName: string;
};

type CachedSourceRecord = {
  hash: string;
  record: SourceModuleRecord;
  targetKey: string;
};

type CachedTransform = {
  cacheKey: string;
  code: string;
  diagnostics: PreviewRegistryDiagnostic[];
  filePath: string;
  hash: string;
};

type CachedEntryMeta = {
  hash: string;
  meta: PreviewEntryMeta;
};

type WorkspaceCache = {
  entriesById: Map<string, PreviewRegistryItem>;
  entryDependencyPathsById: Map<string, string[]>;
  hash: string;
  recordsByTarget: Map<string, Map<string, SourceModuleRecord>>;
  workspace: PreviewWorkspace;
};

type TransformModuleOptions = {
  code?: string;
  filePath: string;
  runtimeModule: string;
  target: IndexedPreviewTarget;
};

const DEFAULT_RUNTIME_MODULE_ID = "virtual:lattice-preview-runtime";
const RBX_STYLE_HELPER_NAME = "__rbxStyle";
const RBX_STYLE_IMPORT = `import { ${RBX_STYLE_HELPER_NAME} } from "@lattice-ui/preview-runtime";\n`;

function hashText(value: string) {
  return createHash("sha1").update(value).digest("hex");
}

function stripTypeSyntax(code: string, filePath: string) {
  return ts.transpileModule(code, {
    compilerOptions: {
      jsx: ts.JsxEmit.Preserve,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      verbatimModuleSyntax: true,
    },
    fileName: filePath,
  }).outputText;
}

function transformPreviewSourceOrThrow(sourceText: string, options: Parameters<typeof transformPreviewSource>[1]) {
  try {
    return transformPreviewSource(sourceText, options);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw createErrorWithCause(`Failed to parse preview source ${options.filePath}: ${detail}`, error);
  }
}

function toComparablePreviewEntry(entry: PreviewRegistryItem) {
  return {
    autoRenderCandidate: entry.autoRenderCandidate,
    autoRenderReason: entry.autoRenderReason,
    candidateExportNames: entry.candidateExportNames,
    discoveryDiagnostics: entry.discoveryDiagnostics,
    exportNames: entry.exportNames,
    hasDefaultExport: entry.hasDefaultExport,
    hasPreviewExport: entry.hasPreviewExport,
    id: entry.id,
    packageName: entry.packageName,
    relativePath: entry.relativePath,
    render: entry.render,
    sourceFilePath: entry.sourceFilePath,
    status: entry.status,
    targetName: entry.targetName,
    title: entry.title,
  };
}

function sortDiagnostics(diagnostics: PreviewRegistryDiagnostic[]) {
  return [...diagnostics].sort((left, right) => {
    if (left.relativeFile !== right.relativeFile) {
      return left.relativeFile.localeCompare(right.relativeFile);
    }

    if (left.line !== right.line) {
      return left.line - right.line;
    }

    if (left.column !== right.column) {
      return left.column - right.column;
    }

    return left.code.localeCompare(right.code);
  });
}

function collectTransitivePaths(
  entryFilePath: string,
  recordsByPath: Map<string, SourceModuleRecord>,
  visited = new Set<string>(),
  collected: string[] = [],
) {
  if (visited.has(entryFilePath)) {
    return collected;
  }

  visited.add(entryFilePath);
  collected.push(entryFilePath);

  const record = recordsByPath.get(entryFilePath);
  if (!record) {
    return collected;
  }

  for (const importPath of record.imports) {
    collectTransitivePaths(importPath, recordsByPath, visited, collected);
  }

  return collected;
}

export class PreviewSourceIndex {
  private readonly entryMetaCache = new Map<string, CachedEntryMeta>();
  private readonly reverseDependencies = new Map<string, Set<string>>();
  private readonly sourceRecordCache = new Map<string, CachedSourceRecord>();
  private readonly transformCache = new Map<string, CachedTransform>();
  private readonly tsconfigCache: ParsedConfigCache = new Map();
  private workspaceCache?: WorkspaceCache;

  public constructor(
    private readonly options: {
      projectName: string;
      targets: PreviewSourceTarget[];
    },
  ) {}

  public getWorkspace() {
    return this.getWorkspaceCache().workspace;
  }

  public getWorkspaceHash() {
    return this.getWorkspaceCache().hash;
  }

  public getImpactedEntryIds(filePath: string) {
    const normalizedFilePath = resolveRealFilePath(stripFileIdDecorations(filePath));
    const workspaceCache = this.workspaceCache;
    if (!workspaceCache) {
      return [];
    }

    const impactedEntryIds: string[] = [];
    for (const [entryId, dependencyPaths] of workspaceCache.entryDependencyPathsById.entries()) {
      if (dependencyPaths.includes(normalizedFilePath)) {
        impactedEntryIds.push(entryId);
      }
    }

    return impactedEntryIds.sort((left, right) => left.localeCompare(right));
  }

  public invalidateFile(filePath: string) {
    const normalizedFilePath = resolveRealFilePath(stripFileIdDecorations(filePath));
    const affectedFiles = this.collectAffectedFiles(normalizedFilePath);

    for (const affectedFile of affectedFiles) {
      this.sourceRecordCache.delete(affectedFile);
    }

    for (const [cacheKey, cachedTransform] of this.transformCache.entries()) {
      if (affectedFiles.has(cachedTransform.filePath)) {
        this.transformCache.delete(cacheKey);
      }
    }

    this.entryMetaCache.clear();
    this.workspaceCache = undefined;
  }

  public findTargetForFilePath(filePath: string) {
    const normalizedFilePath = resolveRealFilePath(stripFileIdDecorations(filePath));
    const extension = normalizedFilePath.slice(normalizedFilePath.lastIndexOf(".")).toLowerCase();
    if (extension !== ".ts" && extension !== ".tsx") {
      return undefined;
    }

    return this.getTargets().find((target) => isFilePathUnderRoot(target.sourceRoot, normalizedFilePath));
  }

  public getEntryMeta(entryId: string): PreviewEntryMeta {
    const workspaceCache = this.getWorkspaceCache();
    const entry = workspaceCache.entriesById.get(entryId);
    if (!entry) {
      throw new Error(`Unknown preview entry: ${entryId}`);
    }

    const dependencyPaths = workspaceCache.entryDependencyPathsById.get(entryId) ?? [entry.sourceFilePath];
    const dependencyHashes = dependencyPaths
      .map((dependencyPath) => {
        const sourceText = fs.existsSync(dependencyPath) ? fs.readFileSync(dependencyPath, "utf8") : "";
        return `${dependencyPath}:${hashText(sourceText)}`;
      })
      .join("|");
    const metaHash = hashText(dependencyHashes);
    const cachedMeta = this.entryMetaCache.get(entryId);
    if (cachedMeta?.hash === metaHash) {
      return cachedMeta.meta;
    }

    const target = this.findTargetForFilePath(entry.sourceFilePath);
    if (!target) {
      throw new Error(`Unable to resolve preview target for ${entry.sourceFilePath}`);
    }

    const diagnosticsMap = new Map<string, PreviewRegistryDiagnostic>();
    for (const dependencyPath of dependencyPaths) {
      const dependencyTarget = this.findTargetForFilePath(dependencyPath) ?? target;
      const transform = this.getTransformedModule({
        filePath: dependencyPath,
        runtimeModule: DEFAULT_RUNTIME_MODULE_ID,
        target: dependencyTarget,
      });

      for (const diagnostic of transform.diagnostics) {
        const key = `${diagnostic.relativeFile}:${diagnostic.line}:${diagnostic.column}:${diagnostic.code}`;
        if (!diagnosticsMap.has(key)) {
          diagnosticsMap.set(key, diagnostic);
        }
      }
    }

    const meta = {
      diagnostics: sortDiagnostics([...diagnosticsMap.values()]),
    };
    this.entryMetaCache.set(entryId, {
      hash: metaHash,
      meta,
    });
    return meta;
  }

  public getTransformedModule(options: TransformModuleOptions) {
    const filePath = resolveRealFilePath(stripFileIdDecorations(options.filePath));
    const sourceText = options.code ?? fs.readFileSync(filePath, "utf8");
    const hash = hashText(sourceText);
    const cacheKey = `${options.target.name}:${options.runtimeModule}:${filePath}`;
    const cachedTransform = this.transformCache.get(cacheKey);
    if (cachedTransform?.hash === hash) {
      return cachedTransform;
    }

    const transformed = transformPreviewSourceOrThrow(sourceText, {
      filePath,
      runtimeModule: options.runtimeModule,
      target: options.target.name,
    });
    let transformedCode = compile_tsx(transformed.code);
    transformedCode = stripTypeSyntax(transformedCode, filePath);
    if (transformedCode.includes(RBX_STYLE_HELPER_NAME) && !transformedCode.includes(RBX_STYLE_IMPORT.trim())) {
      transformedCode = `${RBX_STYLE_IMPORT}${transformedCode}`;
    }

    const cachedResult = {
      cacheKey,
      code: transformedCode,
      diagnostics: sortDiagnostics(
        transformed.errors.map((error) => ({
          ...error,
          relativeFile: toRelativeSourcePath(options.target.packageRoot, error.file),
        })),
      ),
      filePath,
      hash,
    };
    this.transformCache.set(cacheKey, cachedResult);
    return cachedResult;
  }

  private collectAffectedFiles(filePath: string) {
    const affectedFiles = new Set<string>();
    const pending = [filePath];

    while (pending.length > 0) {
      const nextFilePath = pending.pop();
      if (!nextFilePath || affectedFiles.has(nextFilePath)) {
        continue;
      }

      affectedFiles.add(nextFilePath);
      for (const importer of this.reverseDependencies.get(nextFilePath) ?? []) {
        pending.push(importer);
      }
    }

    return affectedFiles;
  }

  private getSourceRecord(target: IndexedPreviewTarget, filePath: string) {
    const normalizedFilePath = resolveRealFilePath(filePath);
    const sourceText = fs.readFileSync(normalizedFilePath, "utf8");
    const hash = hashText(sourceText);
    const targetKey = `${target.name}:${target.packageRoot}:${target.sourceRoot}`;
    const cachedRecord = this.sourceRecordCache.get(normalizedFilePath);
    if (cachedRecord?.hash === hash && cachedRecord.targetKey === targetKey) {
      return cachedRecord.record;
    }

    const record = analyzeSourceModule({
      filePath: normalizedFilePath,
      packageName: target.packageName,
      packageRoot: target.packageRoot,
      sourceRoot: target.sourceRoot,
      tsconfigCache: this.tsconfigCache,
    });
    this.sourceRecordCache.set(normalizedFilePath, {
      hash,
      record,
      targetKey,
    });
    return record;
  }

  private getTargets(): IndexedPreviewTarget[] {
    return this.options.targets.map((target) => ({
      ...target,
      packageName: target.packageName ?? target.name,
    }));
  }

  private getWorkspaceCache(): WorkspaceCache {
    if (this.workspaceCache) {
      return this.workspaceCache;
    }

    this.reverseDependencies.clear();

    const recordsByTarget = new Map<string, Map<string, SourceModuleRecord>>();
    const entries = this.getTargets().flatMap((target) => {
      const records = listSourceFiles(target.sourceRoot).map((filePath) => this.getSourceRecord(target, filePath));
      const recordsByPath = new Map(records.map((record) => [record.filePath, record] as const));
      recordsByTarget.set(target.name, recordsByPath);

      for (const record of records) {
        for (const importPath of record.imports) {
          const importers = this.reverseDependencies.get(importPath);
          if (importers) {
            importers.add(record.filePath);
          } else {
            this.reverseDependencies.set(importPath, new Set([record.filePath]));
          }
        }
      }

      return records
        .filter((record) => record.isTsx)
        .filter((record) => !isPreviewPackageInternalEntry(target.packageRoot, record.relativePath))
        .map((record) => ({
          ...createRegistryItem(record, recordsByPath, target.packageRoot, target.name, target.packageName),
          id: `${target.name}:${record.relativePath}`,
          packageName: target.packageName,
          targetName: target.name,
        }));
    });

    entries.sort((left, right) => {
      if (left.targetName !== right.targetName) {
        return left.targetName.localeCompare(right.targetName);
      }

      return left.relativePath.localeCompare(right.relativePath);
    });

    const entriesById = new Map(entries.map((entry) => [entry.id, entry] as const));
    const entryDependencyPathsById = new Map<string, string[]>();
    for (const entry of entries) {
      const recordsByPath = recordsByTarget.get(entry.targetName);
      if (!recordsByPath) {
        continue;
      }

      const dependencyPaths = collectTransitivePaths(entry.sourceFilePath, recordsByPath).sort((left, right) =>
        left.localeCompare(right),
      );
      entryDependencyPathsById.set(entry.id, dependencyPaths);
    }

    const workspace = {
      entries,
      projectName: this.options.projectName,
      targets: this.getTargets(),
    };
    this.workspaceCache = {
      entriesById,
      entryDependencyPathsById,
      hash: hashText(JSON.stringify(entries.map(toComparablePreviewEntry))),
      recordsByTarget,
      workspace,
    };
    return this.workspaceCache;
  }
}
