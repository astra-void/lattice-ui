import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import ts from "typescript";
import {
  transformPreviewSource,
  type PreviewTransformDiagnostic,
  type PreviewTransformOutcome,
} from "@lattice-ui/compiler";
import { createPreviewEngine } from "./engine";
import { isFilePathUnderRoot, resolveRealFilePath } from "./pathUtils";
import { createWorkspaceGraphService } from "./workspaceGraph";
import { PREVIEW_ENGINE_PROTOCOL_VERSION } from "./types";
import type {
  PreviewBuildArtifactKind,
  PreviewBuildDiagnostic,
  PreviewBuildOptions,
  PreviewBuildOutputManifest,
  PreviewBuildResult,
  PreviewBuiltArtifact,
  PreviewCachedArtifactMetadata,
  PreviewDiagnostic,
  PreviewDiagnosticsSummary,
  PreviewEntryPayload,
  PreviewExecutionMode,
  PreviewSelectionMode,
  PreviewSourceTarget,
} from "./types";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const BUILD_MANIFEST_FILE = ".lattice-preview-manifest.json";
const BUILD_MANIFEST_VERSION = 2;
const DEFAULT_RUNTIME_MODULE = "@lattice-ui/preview-runtime";
const CACHE_NAMESPACES = ["transform", "entry-metadata", "layout-schema", "manifests"] as const;

type CacheNamespace = (typeof CACHE_NAMESPACES)[number];

type BuildTargetContext = {
  configHash: string;
  packageRoot: string;
  parsedConfig?: ts.ParsedCommandLine;
  sourceRoot: string;
  target: PreviewSourceTarget;
};

type SourceModuleRecord = {
  configHash: string;
  dependencyGraphHash: string;
  dependencyPaths: string[];
  relativePath: string;
  sourceFilePath: string;
  sourceHash: string;
  target: PreviewSourceTarget;
};

type CachedModuleArtifactRecord = PreviewCachedArtifactMetadata & {
  artifactKind: "module";
  dependencyGraphHash: string;
  id: string;
  outcome: PreviewTransformOutcome;
  outputCode: string | null;
  relativePath: string;
  sourceHash: string;
};

type CachedEntryMetadataArtifactRecord = PreviewCachedArtifactMetadata & {
  artifactKind: "entry-metadata";
  id: string;
  payload: PreviewEntryPayload;
  relativePath: string;
};

type PreviewLayoutSchemaSidecar = {
  descriptor: PreviewEntryPayload["descriptor"];
  diagnosticsSummary: PreviewEntryPayload["descriptor"]["diagnosticsSummary"];
  entryId: string;
  graphTrace: PreviewEntryPayload["graphTrace"];
  runtimeAdapter: PreviewEntryPayload["runtimeAdapter"];
  supportsLayoutDebug: boolean;
  transform: PreviewEntryPayload["transform"];
};

type CachedLayoutSchemaArtifactRecord = PreviewCachedArtifactMetadata & {
  artifactKind: "layout-schema";
  id: string;
  relativePath: string;
  schema: PreviewLayoutSchemaSidecar;
};

type CachedArtifactRecord =
  | CachedModuleArtifactRecord
  | CachedEntryMetadataArtifactRecord
  | CachedLayoutSchemaArtifactRecord;

function hashText(value: string) {
  return createHash("sha1").update(value).digest("hex");
}

function isTransformableSourceFile(fileName: string) {
  return SOURCE_EXTENSIONS.has(path.extname(fileName)) && !fileName.endsWith(".d.ts") && !fileName.endsWith(".d.tsx");
}

function normalizeRelativePath(filePath: string) {
  return filePath.split(path.sep).join("/");
}

function ensureDirectory(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJsonFile<T>(filePath: string): T | undefined {
  if (!fs.existsSync(filePath)) {
    return undefined;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return undefined;
  }
}

function writeJsonFile(filePath: string, value: unknown) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

function readPackageVersion(relativePathFromBuildFile: string) {
  try {
    const packageJsonPath = path.resolve(__dirname, relativePathFromBuildFile);
    const parsed = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as { version?: string };
    return parsed.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function getBuildVersionFingerprint() {
  return {
    compilerVersion: readPackageVersion("../../compiler/package.json"),
    engineVersion: readPackageVersion("../package.json"),
    previewRuntimeVersion: readPackageVersion("../../preview-runtime/package.json"),
    protocolVersion: PREVIEW_ENGINE_PROTOCOL_VERSION,
  };
}

function createDiagnosticsSummary(diagnostics: PreviewBuildDiagnostic[]): PreviewDiagnosticsSummary {
  const byPhase = {
    discovery: 0,
    layout: 0,
    runtime: 0,
    transform: 0,
  } satisfies Record<PreviewDiagnostic["phase"], number>;

  for (const diagnostic of diagnostics) {
    if ("phase" in diagnostic) {
      byPhase[diagnostic.phase] += 1;
      continue;
    }

    byPhase.transform += 1;
  }

  return {
    byPhase,
    hasBlocking: diagnostics.some((diagnostic) => diagnostic.blocking === true || diagnostic.severity === "error"),
    total: diagnostics.length,
  };
}

function getDiagnosticKey(diagnostic: PreviewBuildDiagnostic) {
  if ("phase" in diagnostic) {
    return JSON.stringify([
      "engine",
      diagnostic.phase,
      diagnostic.entryId,
      diagnostic.file,
      diagnostic.code,
      diagnostic.summary,
      diagnostic.target,
    ]);
  }

  return JSON.stringify([
    "transform",
    diagnostic.file,
    diagnostic.code,
    diagnostic.line,
    diagnostic.column,
    diagnostic.summary,
    diagnostic.target,
  ]);
}

function pushUniqueDiagnostics(
  accumulator: Map<string, PreviewBuildDiagnostic>,
  diagnostics: PreviewBuildDiagnostic[],
) {
  for (const diagnostic of diagnostics) {
    accumulator.set(getDiagnosticKey(diagnostic), diagnostic);
  }
}

function isPathEqualOrContained(rootPath: string, candidatePath: string) {
  const normalizedRoot = resolveRealFilePath(rootPath);
  const normalizedCandidate = resolveRealFilePath(candidatePath);
  return (
    normalizedRoot === normalizedCandidate ||
    normalizedCandidate.startsWith(`${normalizedRoot}${path.sep}`) ||
    normalizedRoot.startsWith(`${normalizedCandidate}${path.sep}`)
  );
}

function findNearestPackageRoot(startPath: string) {
  let current = resolveRealFilePath(startPath);

  while (true) {
    if (fs.existsSync(path.join(current, "package.json"))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return resolveRealFilePath(path.dirname(startPath));
    }

    current = parent;
  }
}

function findNearestTsconfig(startPath: string) {
  return ts.findConfigFile(resolveRealFilePath(startPath), ts.sys.fileExists, "tsconfig.json");
}

function parseTsconfig(tsconfigPath: string) {
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (configFile.error) {
    const diagnostic = ts.formatDiagnostic(configFile.error, {
      getCanonicalFileName: (value) => value,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => "\n",
    });
    throw new Error(`Failed to read TypeScript config ${tsconfigPath}: ${diagnostic}`);
  }

  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(tsconfigPath),
    undefined,
    tsconfigPath,
  );
  if (parsed.errors.length > 0) {
    const diagnostic = ts.formatDiagnostics(parsed.errors, {
      getCanonicalFileName: (value) => value,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => "\n",
    });
    throw new Error(`Failed to parse TypeScript config ${tsconfigPath}: ${diagnostic}`);
  }

  return parsed;
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
      files.push(resolveRealFilePath(entryPath));
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function listTargetSourceFiles(target: PreviewSourceTarget, parsedConfig?: ts.ParsedCommandLine) {
  const sourceRoot = resolveRealFilePath(target.sourceRoot);
  const configuredFiles =
    parsedConfig?.fileNames
      .map((fileName) => resolveRealFilePath(fileName))
      .filter((fileName) => isTransformableSourceFile(fileName) && isFilePathUnderRoot(sourceRoot, fileName)) ?? [];

  if (configuredFiles.length > 0) {
    return [...new Set(configuredFiles)].sort((left, right) => left.localeCompare(right));
  }

  return listSourceFiles(sourceRoot);
}

function findWorkspaceRoot(startPaths: string[]) {
  const candidates = startPaths.map((startPath) => resolveRealFilePath(startPath));
  const markerRoots: string[] = [];

  for (const startPath of candidates) {
    let current = startPath;
    while (true) {
      if (fs.existsSync(path.join(current, "pnpm-workspace.yaml")) || fs.existsSync(path.join(current, ".git"))) {
        markerRoots.push(current);
        break;
      }

      const parent = path.dirname(current);
      if (parent === current) {
        markerRoots.push(startPath);
        break;
      }

      current = parent;
    }
  }

  let commonPath = markerRoots[0] ?? process.cwd();
  for (const candidate of markerRoots.slice(1)) {
    while (!isPathEqualOrContained(commonPath, candidate)) {
      const parent = path.dirname(commonPath);
      if (parent === commonPath) {
        return commonPath;
      }

      commonPath = parent;
    }
  }

  return commonPath;
}

function validateTargetName(targetName: string) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(targetName) || targetName === "." || targetName === "..") {
    throw new Error(`Preview target name must be a safe path segment: ${targetName}`);
  }
}

function validateTargets(targets: PreviewSourceTarget[]) {
  if (targets.length === 0) {
    throw new Error("Preview artifact generation requires at least one target.");
  }

  const seenTargetNames = new Set<string>();
  for (const target of targets) {
    validateTargetName(target.name);
    if (seenTargetNames.has(target.name)) {
      throw new Error(`Duplicate preview target name: ${target.name}`);
    }

    seenTargetNames.add(target.name);

    const sourceRoot = path.resolve(target.sourceRoot);
    if (!fs.existsSync(sourceRoot) || !fs.statSync(sourceRoot).isDirectory()) {
      throw new Error(`Preview source directory does not exist: ${sourceRoot}`);
    }

    const packageRoot = path.resolve(target.packageRoot);
    if (!fs.existsSync(packageRoot) || !fs.statSync(packageRoot).isDirectory()) {
      throw new Error(`Preview package root does not exist: ${packageRoot}`);
    }
  }
}

function validateBuildOptions(options: {
  artifactKinds: PreviewBuildArtifactKind[];
  outDir?: string;
  targets: PreviewSourceTarget[];
  transformMode: PreviewExecutionMode;
  workspaceRoot: string;
}) {
  validateTargets(options.targets);

  if (options.artifactKinds.length === 0) {
    throw new Error("Preview artifact generation requires at least one artifact kind.");
  }

  const uniqueArtifactKinds = new Set(options.artifactKinds);
  if (uniqueArtifactKinds.size !== options.artifactKinds.length) {
    throw new Error("Preview artifact kinds must be unique.");
  }

  if (options.transformMode === "design-time" && options.artifactKinds.includes("module")) {
    throw new Error("Design-time transform mode does not support module artifact generation.");
  }

  if (!options.outDir) {
    return;
  }

  const resolvedOutDir = path.resolve(options.outDir);
  const parsedOutDir = path.parse(resolvedOutDir);
  if (resolvedOutDir === parsedOutDir.root) {
    throw new Error(`Preview output directory is too broad: ${resolvedOutDir}`);
  }

  if (resolvedOutDir === path.resolve(options.workspaceRoot)) {
    throw new Error(`Preview output directory must not be the workspace root: ${resolvedOutDir}`);
  }

  for (const target of options.targets) {
    if (isPathEqualOrContained(path.resolve(target.sourceRoot), resolvedOutDir)) {
      throw new Error(`Preview output directory overlaps the source tree for target ${target.name}: ${resolvedOutDir}`);
    }

    if (isPathEqualOrContained(path.resolve(target.packageRoot), resolvedOutDir)) {
      throw new Error(
        `Preview output directory overlaps the package root for target ${target.name}: ${resolvedOutDir}`,
      );
    }
  }
}

function collectModuleSpecifiers(filePath: string) {
  const sourceText = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const specifiers = new Set<string>();

  function visit(node: ts.Node): void {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
      if (ts.isStringLiteralLike(node.moduleSpecifier)) {
        specifiers.add(node.moduleSpecifier.text);
      }
    }

    if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
      const expression = node.moduleReference.expression;
      if (expression && ts.isStringLiteralLike(expression)) {
        specifiers.add(expression.text);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return [...specifiers];
}

function resolveTransitiveDependencyPaths(
  filePath: string,
  parsedConfig: ts.ParsedCommandLine | undefined,
  workspaceRoot: string,
  memo: Map<string, string[]>,
  visiting: Set<string>,
) {
  const normalizedFilePath = resolveRealFilePath(filePath);
  if (memo.has(normalizedFilePath)) {
    return memo.get(normalizedFilePath)!;
  }

  if (visiting.has(normalizedFilePath)) {
    return [];
  }

  visiting.add(normalizedFilePath);
  const dependencies = new Set<string>();
  const compilerOptions = parsedConfig?.options ?? {
    jsx: ts.JsxEmit.Preserve,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    target: ts.ScriptTarget.ESNext,
  };

  for (const specifier of collectModuleSpecifiers(normalizedFilePath)) {
    const resolution = ts.resolveModuleName(specifier, normalizedFilePath, compilerOptions, ts.sys);
    const resolvedFileName = resolution.resolvedModule?.resolvedFileName;
    if (!resolvedFileName) {
      continue;
    }

    const resolvedPath = resolveRealFilePath(resolvedFileName);
    if (!isTransformableSourceFile(resolvedPath) || !isFilePathUnderRoot(workspaceRoot, resolvedPath)) {
      continue;
    }

    dependencies.add(resolvedPath);
    for (const dependencyPath of resolveTransitiveDependencyPaths(
      resolvedPath,
      parsedConfig,
      workspaceRoot,
      memo,
      visiting,
    )) {
      dependencies.add(dependencyPath);
    }
  }

  visiting.delete(normalizedFilePath);
  const sortedDependencies = [...dependencies].sort((left, right) => left.localeCompare(right));
  memo.set(normalizedFilePath, sortedDependencies);
  return sortedDependencies;
}

function createBuildTargetContexts(targets: PreviewSourceTarget[]) {
  return targets.map((target) => {
    const sourceRoot = resolveRealFilePath(target.sourceRoot);
    const packageRoot = resolveRealFilePath(target.packageRoot);
    const tsconfigPath = findNearestTsconfig(sourceRoot);
    const parsedConfig = tsconfigPath ? parseTsconfig(tsconfigPath) : undefined;
    const configHash = hashText(
      tsconfigPath && fs.existsSync(tsconfigPath)
        ? fs.readFileSync(tsconfigPath, "utf8")
        : JSON.stringify(parsedConfig?.options ?? {}),
    );

    return {
      configHash,
      packageRoot,
      parsedConfig,
      sourceRoot,
      target: {
        ...target,
        packageRoot,
        sourceRoot,
      },
    } satisfies BuildTargetContext;
  });
}

function createModuleRecords(targetContexts: BuildTargetContext[], graphService: ReturnType<typeof createWorkspaceGraphService>) {
  const fileHashCache = new Map<string, string>();
  const records: SourceModuleRecord[] = [];

  for (const context of targetContexts) {
    const sourceFiles = graphService.listTargetSourceFiles(context.target);
    for (const sourceFilePath of sourceFiles) {
      const sourceText = fs.readFileSync(sourceFilePath, "utf8");
      const sourceHash = hashText(sourceText);
      fileHashCache.set(sourceFilePath, sourceHash);

      const dependencyPaths = graphService.collectTransitiveDependencyPaths(sourceFilePath);
      const dependencyGraphHash = hashText(
        dependencyPaths
          .map((dependencyPath) => {
            const dependencyHash =
              fileHashCache.get(dependencyPath) ??
              hashText(fs.existsSync(dependencyPath) ? fs.readFileSync(dependencyPath, "utf8") : "");
            fileHashCache.set(dependencyPath, dependencyHash);
            return `${dependencyPath}:${dependencyHash}`;
          })
          .join("|"),
      );

      records.push({
        configHash: context.configHash,
        dependencyGraphHash,
        dependencyPaths,
        relativePath: normalizeRelativePath(path.relative(context.sourceRoot, sourceFilePath)),
        sourceFilePath,
        sourceHash,
        target: context.target,
      });
    }
  }

  return records.sort((left, right) => {
    if (left.target.name !== right.target.name) {
      return left.target.name.localeCompare(right.target.name);
    }

    return left.relativePath.localeCompare(right.relativePath);
  });
}

function getNamespaceDir(cacheDir: string, namespace: CacheNamespace) {
  return path.join(cacheDir, namespace);
}

function ensureCacheDirectories(cacheDir: string) {
  for (const namespace of CACHE_NAMESPACES) {
    ensureDirectory(getNamespaceDir(cacheDir, namespace));
  }
}

function createModuleCacheKey(
  record: SourceModuleRecord,
  options: {
    runtimeModule: string;
    selectionMode: PreviewSelectionMode;
    transformMode: PreviewExecutionMode;
    versions: ReturnType<typeof getBuildVersionFingerprint>;
  },
) {
  return hashText(
    JSON.stringify({
      artifactKind: "module",
      configHash: record.configHash,
      dependencyGraphHash: record.dependencyGraphHash,
      protocolVersion: options.versions.protocolVersion,
      relativePath: record.relativePath,
      runtimeModule: options.runtimeModule,
      selectionMode: options.selectionMode,
      sourceHash: record.sourceHash,
      targetName: record.target.name,
      transformMode: options.transformMode,
      versions: options.versions,
    }),
  );
}

function createEntryPayloadCacheKey(
  payload: PreviewEntryPayload,
  options: {
    runtimeModule: string;
    selectionMode: PreviewSelectionMode;
    transformMode: PreviewExecutionMode;
    versions: ReturnType<typeof getBuildVersionFingerprint>;
  },
) {
  return hashText(
    JSON.stringify({
      artifactKind: "entry-metadata",
      payload,
      protocolVersion: options.versions.protocolVersion,
      runtimeModule: options.runtimeModule,
      selectionMode: options.selectionMode,
      targetName: payload.descriptor.targetName,
      transformMode: options.transformMode,
      versions: options.versions,
    }),
  );
}

function createLayoutSchemaCacheKey(
  schema: PreviewLayoutSchemaSidecar,
  options: {
    runtimeModule: string;
    selectionMode: PreviewSelectionMode;
    transformMode: PreviewExecutionMode;
    versions: ReturnType<typeof getBuildVersionFingerprint>;
  },
) {
  return hashText(
    JSON.stringify({
      artifactKind: "layout-schema",
      protocolVersion: options.versions.protocolVersion,
      runtimeModule: options.runtimeModule,
      schema,
      selectionMode: options.selectionMode,
      targetName: schema.descriptor.targetName,
      transformMode: options.transformMode,
      versions: options.versions,
    }),
  );
}

function getModuleCachePath(cacheDir: string, cacheKey: string) {
  return path.join(getNamespaceDir(cacheDir, "transform"), `${cacheKey}.json`);
}

function getEntryMetadataCachePath(cacheDir: string, cacheKey: string) {
  return path.join(getNamespaceDir(cacheDir, "entry-metadata"), `${cacheKey}.json`);
}

function getLayoutSchemaCachePath(cacheDir: string, cacheKey: string) {
  return path.join(getNamespaceDir(cacheDir, "layout-schema"), `${cacheKey}.json`);
}

function isPreviewDiagnostic(value: PreviewBuildDiagnostic): value is PreviewDiagnostic {
  return "phase" in value;
}

function createBuildManifestKey(options: {
  artifactKinds: PreviewBuildArtifactKind[];
  projectName: string;
  selectionMode: PreviewSelectionMode;
  targets: PreviewSourceTarget[];
  transformMode: PreviewExecutionMode;
}) {
  return hashText(
    JSON.stringify({
      artifactKinds: options.artifactKinds,
      projectName: options.projectName,
      selectionMode: options.selectionMode,
      targets: options.targets.map((target) => ({
        name: target.name,
        packageRoot: target.packageRoot,
        sourceRoot: target.sourceRoot,
      })),
      transformMode: options.transformMode,
    }),
  );
}

function createPreviewLayoutSchema(payload: PreviewEntryPayload): PreviewLayoutSchemaSidecar {
  return {
    descriptor: payload.descriptor,
    diagnosticsSummary: payload.descriptor.diagnosticsSummary,
    entryId: payload.descriptor.id,
    graphTrace: payload.graphTrace,
    runtimeAdapter: payload.runtimeAdapter,
    supportsLayoutDebug: payload.descriptor.capabilities.supportsLayoutDebug,
    transform: payload.transform,
  };
}

function getMetadataMaterializedRelativePath(kind: "entry-metadata" | "layout-schema", relativePath: string) {
  const suffix = kind === "entry-metadata" ? ".preview-entry.json" : ".preview-layout.json";
  const namespace = kind === "entry-metadata" ? "entry-metadata" : "layout-schema";
  return normalizeRelativePath(path.posix.join(".preview-engine", namespace, `${relativePath}${suffix}`));
}

function createMaterializedFilePath(outDir: string, relativePath: string) {
  const normalizedRelativePath = normalizeRelativePath(relativePath);
  if (normalizedRelativePath.startsWith("../") || path.isAbsolute(normalizedRelativePath)) {
    throw new Error(`Preview materialization path escaped the output directory: ${relativePath}`);
  }

  return path.join(outDir, normalizedRelativePath);
}

function readOutputManifest(outDir: string): PreviewBuildOutputManifest {
  const manifestPath = path.join(outDir, BUILD_MANIFEST_FILE);
  const manifest = readJsonFile<PreviewBuildOutputManifest>(manifestPath);
  if (manifest && manifest.version === BUILD_MANIFEST_VERSION && typeof manifest.files === "object") {
    return manifest;
  }

  return {
    artifactKinds: [],
    files: {},
    version: BUILD_MANIFEST_VERSION,
    workspaceRoot: "",
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

async function runWithConcurrency<T>(
  limit: number,
  values: T[],
  worker: (value: T) => Promise<void>,
) {
  const concurrency = Math.max(1, limit);
  let cursor = 0;

  async function runNext(): Promise<void> {
    if (cursor >= values.length) {
      return;
    }

    const currentIndex = cursor;
    cursor += 1;
    await worker(values[currentIndex]!);
    await runNext();
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, () => runNext()),
  );
}

function sortBuiltArtifacts(artifacts: PreviewBuiltArtifact[]) {
  return [...artifacts].sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind.localeCompare(right.kind);
    }

    if (left.targetName !== right.targetName) {
      return left.targetName.localeCompare(right.targetName);
    }

    return left.relativePath.localeCompare(right.relativePath);
  });
}

function collectBlockingTransformDiagnostics(diagnostics: PreviewBuildDiagnostic[]) {
  return diagnostics.filter((diagnostic): diagnostic is PreviewTransformDiagnostic => !isPreviewDiagnostic(diagnostic));
}

export async function buildPreviewArtifacts(options: PreviewBuildOptions): Promise<PreviewBuildResult> {
  const targets = options.targets.map((target) => ({
    ...target,
    packageName: target.packageName ?? target.name,
    packageRoot: resolveRealFilePath(target.packageRoot),
    sourceRoot: resolveRealFilePath(target.sourceRoot),
  }));
  const selectionMode = options.selectionMode ?? "compat";
  const transformMode = options.transformMode ?? "strict-fidelity";
  const runtimeModule = options.runtimeModule ?? DEFAULT_RUNTIME_MODULE;
  const workspaceRoot = resolveRealFilePath(
    options.workspaceRoot ?? findWorkspaceRoot(targets.map((target) => target.packageRoot)),
  );
  const cacheDir = resolveRealFilePath(options.cacheDir ?? path.join(workspaceRoot, ".lattice-preview-cache"));
  const concurrency = options.concurrency ?? Math.max(1, (os.availableParallelism?.() ?? os.cpus().length) - 1);
  const artifactKinds = [...options.artifactKinds];

  validateBuildOptions({
    artifactKinds,
    outDir: options.outDir,
    targets,
    transformMode,
    workspaceRoot,
  });

  ensureCacheDirectories(cacheDir);

  const versions = getBuildVersionFingerprint();
  const builtArtifacts: PreviewBuiltArtifact[] = [];
  const reusedArtifacts: PreviewBuiltArtifact[] = [];
  const diagnosticsMap = new Map<string, PreviewBuildDiagnostic>();
  const materializedFiles = new Map<
    string,
    {
      cacheKey: string;
      content: string;
      sourceFilePath: string;
    }
  >();

  const targetContexts = createBuildTargetContexts(targets);
  const graphService = createWorkspaceGraphService({
    targets,
    workspaceRoot,
  });
  const moduleRecords = artifactKinds.includes("module") ? createModuleRecords(targetContexts, graphService) : [];

  await runWithConcurrency(concurrency, moduleRecords, async (record) => {
    const cacheKey = createModuleCacheKey(record, {
      runtimeModule,
      selectionMode,
      transformMode,
      versions,
    });
    const cachePath = getModuleCachePath(cacheDir, cacheKey);
    let cachedRecord = readJsonFile<CachedModuleArtifactRecord>(cachePath);
    let reusedFromCache = Boolean(cachedRecord);

    if (!cachedRecord) {
      const sourceText = fs.readFileSync(record.sourceFilePath, "utf8");
      let transformed;
      try {
        transformed = transformPreviewSource(sourceText, {
          filePath: record.sourceFilePath,
          mode: transformMode,
          runtimeModule,
          target: record.target.name,
        });
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to parse preview source ${record.sourceFilePath}: ${detail}`);
      }

      cachedRecord = {
        artifactKind: "module",
        cacheKey,
        createdAt: new Date().toISOString(),
        dependencyGraphHash: record.dependencyGraphHash,
        diagnostics: transformed.diagnostics,
        engineVersion: versions.protocolVersion,
        id: `${record.target.name}:${record.relativePath}`,
        outcome: transformed.outcome,
        outputCode: transformed.code,
        relativePath: record.relativePath,
        sourceFilePath: record.sourceFilePath,
        sourceHash: record.sourceHash,
        targetName: record.target.name,
      };
      writeJsonFile(cachePath, cachedRecord);
      reusedFromCache = false;
    }

    const diagnosticsSummary = createDiagnosticsSummary(cachedRecord.diagnostics);
    const builtArtifact: PreviewBuiltArtifact = {
      cacheKey,
      diagnosticsSummary,
      id: cachedRecord.id,
      kind: "module",
      relativePath: cachedRecord.relativePath,
      reusedFromCache,
      sourceFilePath: cachedRecord.sourceFilePath,
      targetName: cachedRecord.targetName,
    };

    pushUniqueDiagnostics(diagnosticsMap, cachedRecord.diagnostics);

    if (options.outDir && cachedRecord.outputCode !== null) {
      const relativeOutputPath = normalizeRelativePath(path.posix.join(cachedRecord.targetName, cachedRecord.relativePath));
      materializedFiles.set(relativeOutputPath, {
        cacheKey,
        content: cachedRecord.outputCode,
        sourceFilePath: cachedRecord.sourceFilePath,
      });
    }

    builtArtifacts.push(builtArtifact);
    if (reusedFromCache) {
      reusedArtifacts.push(builtArtifact);
    }
  });

  let previewEngine:
    | ReturnType<typeof createPreviewEngine>
    | undefined;
  if (artifactKinds.includes("entry-metadata") || artifactKinds.includes("layout-schema")) {
    previewEngine = createPreviewEngine({
      projectName: options.projectName,
      runtimeModule,
      selectionMode,
      targets,
      transformMode,
    });

    const workspaceIndex = previewEngine.getWorkspaceIndex();
    const payloads = workspaceIndex.entries.map((entry) => previewEngine!.getEntryPayload(entry.id));

    await runWithConcurrency(concurrency, payloads, async (payload) => {
      if (artifactKinds.includes("entry-metadata")) {
        const cacheKey = createEntryPayloadCacheKey(payload, {
          runtimeModule,
          selectionMode,
          transformMode,
          versions,
        });
        const cachePath = getEntryMetadataCachePath(cacheDir, cacheKey);
        let cachedRecord = readJsonFile<CachedEntryMetadataArtifactRecord>(cachePath);
        let reusedFromCache = Boolean(cachedRecord);

        if (!cachedRecord) {
          cachedRecord = {
            artifactKind: "entry-metadata",
            cacheKey,
            createdAt: new Date().toISOString(),
            diagnostics: payload.diagnostics,
            engineVersion: versions.protocolVersion,
            id: payload.descriptor.id,
            payload,
            relativePath: payload.descriptor.relativePath,
            sourceFilePath: payload.descriptor.sourceFilePath,
            targetName: payload.descriptor.targetName,
          };
          writeJsonFile(cachePath, cachedRecord);
          reusedFromCache = false;
        }

        const builtArtifact: PreviewBuiltArtifact = {
          cacheKey,
          diagnosticsSummary: payload.descriptor.diagnosticsSummary,
          id: payload.descriptor.id,
          kind: "entry-metadata",
          relativePath: payload.descriptor.relativePath,
          reusedFromCache,
          sourceFilePath: payload.descriptor.sourceFilePath,
          targetName: payload.descriptor.targetName,
        };

        pushUniqueDiagnostics(diagnosticsMap, cachedRecord.diagnostics);

        if (options.outDir) {
          const relativeOutputPath = normalizeRelativePath(
            path.posix.join(
              payload.descriptor.targetName,
              getMetadataMaterializedRelativePath("entry-metadata", payload.descriptor.relativePath),
            ),
          );
          materializedFiles.set(relativeOutputPath, {
            cacheKey,
            content: JSON.stringify(cachedRecord.payload, null, 2),
            sourceFilePath: payload.descriptor.sourceFilePath,
          });
        }

        builtArtifacts.push(builtArtifact);
        if (reusedFromCache) {
          reusedArtifacts.push(builtArtifact);
        }
      }

      if (artifactKinds.includes("layout-schema")) {
        const schema = createPreviewLayoutSchema(payload);
        const cacheKey = createLayoutSchemaCacheKey(schema, {
          runtimeModule,
          selectionMode,
          transformMode,
          versions,
        });
        const cachePath = getLayoutSchemaCachePath(cacheDir, cacheKey);
        let cachedRecord = readJsonFile<CachedLayoutSchemaArtifactRecord>(cachePath);
        let reusedFromCache = Boolean(cachedRecord);

        if (!cachedRecord) {
          cachedRecord = {
            artifactKind: "layout-schema",
            cacheKey,
            createdAt: new Date().toISOString(),
            diagnostics: payload.diagnostics,
            engineVersion: versions.protocolVersion,
            id: payload.descriptor.id,
            relativePath: payload.descriptor.relativePath,
            schema,
            sourceFilePath: payload.descriptor.sourceFilePath,
            targetName: payload.descriptor.targetName,
          };
          writeJsonFile(cachePath, cachedRecord);
          reusedFromCache = false;
        }

        const builtArtifact: PreviewBuiltArtifact = {
          cacheKey,
          diagnosticsSummary: payload.descriptor.diagnosticsSummary,
          id: payload.descriptor.id,
          kind: "layout-schema",
          relativePath: payload.descriptor.relativePath,
          reusedFromCache,
          sourceFilePath: payload.descriptor.sourceFilePath,
          targetName: payload.descriptor.targetName,
        };

        pushUniqueDiagnostics(diagnosticsMap, cachedRecord.diagnostics);

        if (options.outDir) {
          const relativeOutputPath = normalizeRelativePath(
            path.posix.join(
              payload.descriptor.targetName,
              getMetadataMaterializedRelativePath("layout-schema", payload.descriptor.relativePath),
            ),
          );
          materializedFiles.set(relativeOutputPath, {
            cacheKey,
            content: JSON.stringify(cachedRecord.schema, null, 2),
            sourceFilePath: payload.descriptor.sourceFilePath,
          });
        }

        builtArtifacts.push(builtArtifact);
        if (reusedFromCache) {
          reusedArtifacts.push(builtArtifact);
        }
      }
    });

    const manifestKey = createBuildManifestKey({
      artifactKinds,
      projectName: options.projectName,
      selectionMode,
      targets,
      transformMode,
    });
    writeJsonFile(path.join(getNamespaceDir(cacheDir, "manifests"), `${manifestKey}.json`), {
      artifactKinds,
      builtArtifactIds: sortBuiltArtifacts(builtArtifacts).map((artifact) => artifact.id),
      createdAt: new Date().toISOString(),
      projectName: options.projectName,
      workspaceIndex,
      workspaceRoot,
    });
  }

  previewEngine?.dispose();

  const diagnostics = [...diagnosticsMap.values()];
  const blockingTransformDiagnostics = collectBlockingTransformDiagnostics(diagnostics).filter(
    (diagnostic) => diagnostic.blocking,
  );

  const writtenFiles: string[] = [];
  const removedFiles: string[] = [];

  if (options.outDir) {
    ensureDirectory(options.outDir);
    const previousManifest = readOutputManifest(options.outDir);
    const nextManifest: PreviewBuildOutputManifest = {
      artifactKinds,
      files: {},
      version: BUILD_MANIFEST_VERSION,
      workspaceRoot,
    };

    const shouldMaterializeModuleArtifacts = blockingTransformDiagnostics.length === 0;

    for (const [relativeOutputPath, fileRecord] of [...materializedFiles.entries()].sort((left, right) =>
      left[0].localeCompare(right[0]),
    )) {
      const isModuleOutput = !relativeOutputPath.includes("/.preview-engine/");
      if (isModuleOutput && !shouldMaterializeModuleArtifacts) {
        continue;
      }

      const absoluteOutputPath = createMaterializedFilePath(options.outDir, relativeOutputPath);
      nextManifest.files[relativeOutputPath] = {
        cacheKey: fileRecord.cacheKey,
        sourceFilePath: fileRecord.sourceFilePath,
      };

      const previousEntry = previousManifest.files[relativeOutputPath];
      if (previousEntry?.cacheKey === fileRecord.cacheKey && fs.existsSync(absoluteOutputPath)) {
        continue;
      }

      ensureDirectory(path.dirname(absoluteOutputPath));
      fs.writeFileSync(absoluteOutputPath, fileRecord.content, "utf8");
      writtenFiles.push(absoluteOutputPath);
    }

    for (const relativeOutputPath of Object.keys(previousManifest.files)) {
      if (relativeOutputPath in nextManifest.files) {
        continue;
      }

      const absoluteOutputPath = createMaterializedFilePath(options.outDir, relativeOutputPath);
      if (!fs.existsSync(absoluteOutputPath)) {
        continue;
      }

      fs.rmSync(absoluteOutputPath, { force: true });
      removeEmptyParentDirectories(options.outDir, absoluteOutputPath);
      removedFiles.push(absoluteOutputPath);
    }

    writeJsonFile(path.join(options.outDir, BUILD_MANIFEST_FILE), nextManifest);

    for (const builtArtifact of builtArtifacts) {
      const manifestEntry = Object.entries(nextManifest.files).find(([, value]) => value.cacheKey === builtArtifact.cacheKey);
      if (!manifestEntry) {
        continue;
      }

      builtArtifact.materializedPath = createMaterializedFilePath(options.outDir, manifestEntry[0]);
    }
  }

  return {
    builtArtifacts: sortBuiltArtifacts(builtArtifacts),
    cacheDir,
    diagnostics,
    outDir: options.outDir,
    removedFiles: removedFiles.sort((left, right) => left.localeCompare(right)),
    reusedArtifacts: sortBuiltArtifacts(reusedArtifacts),
    writtenFiles: writtenFiles.sort((left, right) => left.localeCompare(right)),
  };
}
