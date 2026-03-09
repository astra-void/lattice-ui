import fs from "node:fs";
import path from "node:path";
import { transformPreviewSource } from "@lattice-ui/compiler";
import ts from "typescript";
import { createErrorWithCause } from "../errorWithCause";
import { isFilePathUnderRoot, resolveRealFilePath } from "./pathUtils";
import type {
  PreviewAutoRenderSelectionReason,
  PreviewDiscoveryDiagnostic,
  PreviewProject,
  PreviewRegistryDiagnostic,
  PreviewRegistryItem,
  PreviewRenderTarget,
  PreviewSourceTarget,
  PreviewWorkspace,
} from "./types";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const DEFAULT_COMPILER_OPTIONS: ts.CompilerOptions = {
  jsx: ts.JsxEmit.Preserve,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
  target: ts.ScriptTarget.ESNext,
};

type PreviewExportInfo = {
  title?: string;
  hasExport: boolean;
  hasProps: boolean;
  hasRender: boolean;
};

type LocalRenderableDeclarationKind =
  | "function-declaration"
  | "variable-arrow"
  | "variable-function"
  | "variable-other";

type LocalRenderableMetadata = {
  name: string;
  isRenderable: boolean;
  matchesFileBasename: boolean;
  declarationKind: LocalRenderableDeclarationKind;
};

type ExportedRenderableCandidate = {
  exportName: string;
  isRenderable: boolean;
  matchesFileBasename: boolean;
  declarationKind: LocalRenderableDeclarationKind;
};

type SelectRenderTargetResult = {
  render: PreviewRenderTarget;
  autoRenderCandidate?: "default" | string;
  autoRenderReason?: PreviewAutoRenderSelectionReason;
};

type SourceModuleRecord = {
  filePath: string;
  relativePath: string;
  isTsx: boolean;
  imports: string[];
  diagnostics: PreviewRegistryDiagnostic[];
  discoveryDiagnostics: PreviewDiscoveryDiagnostic[];
  candidateExportNames: string[];
  hasDefaultComponent: boolean;
  autoRenderCandidate?: "default" | string;
  autoRenderReason?: PreviewAutoRenderSelectionReason;
  render: PreviewRenderTarget;
  preview: PreviewExportInfo;
};

type DiscoverPreviewProjectOptions = {
  packageName?: string;
  packageRoot: string;
  sourceRoot: string;
};

type DiscoverPreviewWorkspaceOptions = {
  projectName: string;
  targets: PreviewSourceTarget[];
};

type ParsedConfigCache = Map<string, ts.ParsedCommandLine>;

type ResolveModuleImportOptions = {
  importerFilePath: string;
  packageRoot: string;
  sourceRoot: string;
  specifier: string;
  tsconfigCache: ParsedConfigCache;
};

const PREVIEW_PACKAGE_ENTRY_EXCLUDES = ["runtime/", "shell/"];

function isTransformableSourceFile(fileName: string) {
  return SOURCE_EXTENSIONS.has(path.extname(fileName)) && !fileName.endsWith(".d.ts") && !fileName.endsWith(".d.tsx");
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

function transformPreviewSourceOrThrow(sourceText: string, options: Parameters<typeof transformPreviewSource>[1]) {
  try {
    return transformPreviewSource(sourceText, options);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw createErrorWithCause(`Failed to parse preview source ${options.filePath}: ${detail}`, error);
  }
}

function toRelativeSourcePath(packageRoot: string, filePath: string) {
  const relativePath = path.relative(resolveRealFilePath(packageRoot), resolveRealFilePath(filePath));
  return relativePath.split(path.sep).join("/");
}

function humanizeTitle(relativePath: string) {
  const baseName = path.basename(relativePath, path.extname(relativePath));
  return baseName
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}

function isExported(node: ts.Node) {
  return (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0;
}

function isDefaultExport(node: ts.Node) {
  return (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Default) !== 0;
}

function isComponentName(name: string) {
  return /^[A-Z]/.test(name);
}

function isRenderableInitializer(initializer: ts.Expression | undefined) {
  return Boolean(initializer && (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer)));
}

function getVariableDeclarationKind(initializer: ts.Expression | undefined): LocalRenderableDeclarationKind {
  if (initializer && ts.isArrowFunction(initializer)) {
    return "variable-arrow";
  }

  if (initializer && ts.isFunctionExpression(initializer)) {
    return "variable-function";
  }

  return "variable-other";
}

function getPropertyNameText(name: ts.PropertyName) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }

  return undefined;
}

function parsePreviewObject(node: ts.Expression | undefined): PreviewExportInfo | undefined {
  if (!node || !ts.isObjectLiteralExpression(node)) {
    return undefined;
  }

  let title: string | undefined;
  let hasProps = false;
  let hasRender = false;

  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property) && !ts.isShorthandPropertyAssignment(property)) {
      continue;
    }

    const propertyName = getPropertyNameText(property.name);
    if (!propertyName) {
      continue;
    }

    if (propertyName === "title" && ts.isPropertyAssignment(property)) {
      const initializer = property.initializer;
      if (ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer)) {
        title = initializer.text;
      }
      continue;
    }

    if (propertyName === "props") {
      hasProps = true;
      continue;
    }

    if (propertyName === "render") {
      hasRender = true;
    }
  }

  return {
    title,
    hasExport: true,
    hasProps,
    hasRender,
  };
}

function findNearestTsconfig(filePath: string) {
  return ts.findConfigFile(path.dirname(filePath), ts.sys.fileExists, "tsconfig.json");
}

function parseTsconfig(tsconfigPath: string) {
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (configFile.error) {
    const message = ts.formatDiagnostic(configFile.error, {
      getCanonicalFileName: (value) => value,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => "\n",
    });
    throw new Error(`Failed to read TypeScript config ${tsconfigPath}: ${message}`);
  }

  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(tsconfigPath),
    undefined,
    tsconfigPath,
  );
  if (parsed.errors.length > 0) {
    const message = ts.formatDiagnostics(parsed.errors, {
      getCanonicalFileName: (value) => value,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => "\n",
    });
    throw new Error(`Failed to parse TypeScript config ${tsconfigPath}: ${message}`);
  }

  return parsed;
}

function getParsedTsconfig(filePath: string, cache: ParsedConfigCache) {
  const tsconfigPath = findNearestTsconfig(filePath);
  if (!tsconfigPath) {
    return undefined;
  }

  const cachedConfig = cache.get(tsconfigPath);
  if (cachedConfig) {
    return cachedConfig;
  }

  const parsed = parseTsconfig(tsconfigPath);
  cache.set(tsconfigPath, parsed);
  return parsed;
}

function createDiscoveryDiagnostic(
  packageRoot: string,
  filePath: string,
  code: PreviewDiscoveryDiagnostic["code"],
  message: string,
): PreviewDiscoveryDiagnostic {
  return {
    code,
    file: filePath,
    message,
    relativeFile: toRelativeSourcePath(packageRoot, filePath),
  };
}

function shouldReportTransitiveLimit(options: {
  packageRoot: string;
  parsedConfig?: ts.ParsedCommandLine;
  resolvedFilePath?: string;
  specifier: string;
}) {
  if (options.specifier.startsWith(".")) {
    return true;
  }

  if (options.resolvedFilePath && isFilePathUnderRoot(options.packageRoot, options.resolvedFilePath)) {
    return true;
  }

  if (!options.resolvedFilePath && (options.parsedConfig?.options.baseUrl || options.parsedConfig?.options.paths)) {
    return true;
  }

  return false;
}

function createTransitiveAnalysisLimitDiagnostic(
  packageRoot: string,
  importerFilePath: string,
  specifier: string,
  reason: string,
) {
  return createDiscoveryDiagnostic(
    packageRoot,
    importerFilePath,
    "TRANSITIVE_ANALYSIS_LIMITED",
    `Transitive analysis stopped at ${JSON.stringify(specifier)}: ${reason}`,
  );
}

function resolveModuleImport(options: ResolveModuleImportOptions) {
  const parsedConfig = getParsedTsconfig(options.importerFilePath, options.tsconfigCache);
  const compilerOptions = parsedConfig?.options ?? DEFAULT_COMPILER_OPTIONS;
  const resolution = ts.resolveModuleName(options.specifier, options.importerFilePath, compilerOptions, ts.sys);
  const resolvedFilePath = resolution.resolvedModule?.resolvedFileName
    ? resolveRealFilePath(resolution.resolvedModule.resolvedFileName)
    : undefined;

  if (!resolvedFilePath) {
    return shouldReportTransitiveLimit({
      packageRoot: options.packageRoot,
      parsedConfig,
      specifier: options.specifier,
    })
      ? {
          diagnostic: createTransitiveAnalysisLimitDiagnostic(
            options.packageRoot,
            options.importerFilePath,
            options.specifier,
            `it could not be resolved from ${toRelativeSourcePath(options.packageRoot, options.importerFilePath)}.`,
          ),
        }
      : {};
  }

  if (!isTransformableSourceFile(resolvedFilePath)) {
    return shouldReportTransitiveLimit({
      packageRoot: options.packageRoot,
      parsedConfig,
      resolvedFilePath,
      specifier: options.specifier,
    })
      ? {
          diagnostic: createTransitiveAnalysisLimitDiagnostic(
            options.packageRoot,
            options.importerFilePath,
            options.specifier,
            `it resolves to a non-transformable file (${toRelativeSourcePath(options.packageRoot, resolvedFilePath)}).`,
          ),
        }
      : {};
  }

  if (!isFilePathUnderRoot(options.sourceRoot, resolvedFilePath)) {
    return shouldReportTransitiveLimit({
      packageRoot: options.packageRoot,
      parsedConfig,
      resolvedFilePath,
      specifier: options.specifier,
    })
      ? {
          diagnostic: createTransitiveAnalysisLimitDiagnostic(
            options.packageRoot,
            options.importerFilePath,
            options.specifier,
            `it resolves outside the current source root (${toRelativeSourcePath(options.packageRoot, resolvedFilePath)}).`,
          ),
        }
      : {};
  }

  return {
    resolvedImport: resolvedFilePath,
  };
}

function collectLocalRenderableNames(sourceFile: ts.SourceFile) {
  const fileBasename = path.basename(sourceFile.fileName, path.extname(sourceFile.fileName));
  const localRenderableMetadata = new Map<string, LocalRenderableMetadata>();
  let localPreviewInfo: PreviewExportInfo | undefined;

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name && isComponentName(statement.name.text)) {
      localRenderableMetadata.set(statement.name.text, {
        name: statement.name.text,
        isRenderable: true,
        matchesFileBasename: statement.name.text === fileBasename,
        declarationKind: "function-declaration",
      });
      continue;
    }

    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) {
        continue;
      }

      if (declaration.name.text === "preview") {
        localPreviewInfo = parsePreviewObject(declaration.initializer) ?? localPreviewInfo;
      }

      if (isComponentName(declaration.name.text)) {
        localRenderableMetadata.set(declaration.name.text, {
          name: declaration.name.text,
          isRenderable: isRenderableInitializer(declaration.initializer),
          matchesFileBasename: declaration.name.text === fileBasename,
          declarationKind: getVariableDeclarationKind(declaration.initializer),
        });
      }
    }
  }

  return {
    localRenderableMetadata,
    localPreviewInfo,
  };
}

function selectRenderTarget(options: {
  candidateExportNames: string[];
  exportedRenderableCandidates: ExportedRenderableCandidate[];
  hasDefaultComponent: boolean;
  preview: PreviewExportInfo;
}): SelectRenderTargetResult {
  if (options.preview.hasRender) {
    return {
      render: { mode: "preview-render" },
    };
  }

  if (options.hasDefaultComponent) {
    return {
      autoRenderCandidate: "default",
      autoRenderReason: "default",
      render: {
        mode: "auto",
        exportName: "default",
        usesPreviewProps: options.preview.hasProps,
        selectedBy: "default",
      },
    };
  }

  const basenameMatch = options.exportedRenderableCandidates.find((candidate) => candidate.matchesFileBasename);
  if (basenameMatch) {
    return {
      autoRenderCandidate: basenameMatch.exportName,
      autoRenderReason: "basename-match",
      render: {
        mode: "auto",
        exportName: basenameMatch.exportName,
        usesPreviewProps: options.preview.hasProps,
        selectedBy: "basename-match",
      },
    };
  }

  if (options.candidateExportNames.length === 1) {
    return {
      autoRenderCandidate: options.candidateExportNames[0],
      autoRenderReason: "sole-export",
      render: {
        mode: "auto",
        exportName: options.candidateExportNames[0],
        usesPreviewProps: options.preview.hasProps,
        selectedBy: "sole-export",
      },
    };
  }

  return {
    render:
      options.candidateExportNames.length === 0
        ? {
            mode: "none",
            reason: "no-component-export",
          }
        : {
            mode: "none",
            reason: "ambiguous-exports",
            candidates: [...options.candidateExportNames],
          },
  };
}

function analyzeSourceModule(options: {
  filePath: string;
  packageName: string;
  packageRoot: string;
  sourceRoot: string;
  tsconfigCache: ParsedConfigCache;
}): SourceModuleRecord {
  const sourceText = fs.readFileSync(options.filePath, "utf8");
  const scriptKind = options.filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(options.filePath, sourceText, ts.ScriptTarget.Latest, true, scriptKind);
  const fileBasename = path.basename(options.filePath, path.extname(options.filePath));
  const { localRenderableMetadata, localPreviewInfo } = collectLocalRenderableNames(sourceFile);
  const namedExportCandidates = new Map<string, ExportedRenderableCandidate>();
  const imports = new Set<string>();
  const discoveryDiagnostics = new Map<string, PreviewDiscoveryDiagnostic>();
  let hasDefaultComponent = false;
  let previewExported = false;
  let preview = localPreviewInfo;

  const addNamedExportCandidate = (localName: string, exportName: string) => {
    const localMetadata = localRenderableMetadata.get(localName);
    if (!localMetadata?.isRenderable) {
      return;
    }

    namedExportCandidates.set(exportName, {
      exportName,
      isRenderable: localMetadata.isRenderable,
      matchesFileBasename: exportName === fileBasename,
      declarationKind: localMetadata.declarationKind,
    });
  };

  for (const statement of sourceFile.statements) {
    const moduleSpecifier =
      (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) && statement.moduleSpecifier
        ? ts.isStringLiteral(statement.moduleSpecifier)
          ? statement.moduleSpecifier.text
          : undefined
        : undefined;

    if (moduleSpecifier) {
      const resolvedImport = resolveModuleImport({
        importerFilePath: options.filePath,
        packageRoot: options.packageRoot,
        sourceRoot: options.sourceRoot,
        specifier: moduleSpecifier,
        tsconfigCache: options.tsconfigCache,
      });

      if (resolvedImport.resolvedImport) {
        imports.add(resolvedImport.resolvedImport);
      }

      if (resolvedImport.diagnostic) {
        const key = `${resolvedImport.diagnostic.code}:${resolvedImport.diagnostic.relativeFile}:${resolvedImport.diagnostic.message}`;
        discoveryDiagnostics.set(key, resolvedImport.diagnostic);
      }
    }

    if (ts.isFunctionDeclaration(statement) && isExported(statement)) {
      if (statement.name?.text === "preview") {
        previewExported = true;
      } else if (statement.name) {
        if (isDefaultExport(statement)) {
          hasDefaultComponent = Boolean(localRenderableMetadata.get(statement.name.text)?.isRenderable);
        } else {
          addNamedExportCandidate(statement.name.text, statement.name.text);
        }
      } else if (isDefaultExport(statement)) {
        hasDefaultComponent = true;
      }
      continue;
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) {
          continue;
        }

        if (declaration.name.text === "preview" && isExported(statement)) {
          previewExported = true;
          preview = parsePreviewObject(declaration.initializer) ??
            preview ?? {
              hasExport: true,
              hasProps: false,
              hasRender: false,
            };
          continue;
        }

        if (!isExported(statement)) {
          continue;
        }

        addNamedExportCandidate(declaration.name.text, declaration.name.text);
      }
      continue;
    }

    if (ts.isExportAssignment(statement)) {
      if (ts.isIdentifier(statement.expression) && localRenderableMetadata.get(statement.expression.text)?.isRenderable) {
        hasDefaultComponent = true;
      } else if (ts.isArrowFunction(statement.expression) || ts.isFunctionExpression(statement.expression)) {
        hasDefaultComponent = true;
      }
      continue;
    }

    if (!ts.isExportDeclaration(statement) || statement.isTypeOnly || !statement.exportClause) {
      continue;
    }

    if (ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) {
        const localName = element.propertyName?.text ?? element.name.text;
        const exportName = element.name.text;

        if (localName === "preview") {
          previewExported = true;
          continue;
        }

        if (!localRenderableMetadata.get(localName)?.isRenderable) {
          continue;
        }

        if (exportName === "default") {
          hasDefaultComponent = true;
        } else {
          addNamedExportCandidate(localName, exportName);
        }
      }
    }
  }

  const transformResult = transformPreviewSourceOrThrow(sourceText, {
    filePath: options.filePath,
    runtimeModule: "virtual:lattice-preview-runtime",
    target: options.packageName,
  });
  const diagnostics = transformResult.errors.map((error) => ({
    ...error,
    relativeFile: toRelativeSourcePath(options.packageRoot, error.file),
  }));
  const exportedRenderableCandidates = [...namedExportCandidates.values()].sort((left, right) =>
    left.exportName.localeCompare(right.exportName),
  );
  const candidateExportNames = exportedRenderableCandidates.map((candidate) => candidate.exportName);
  const resolvedPreview = previewExported
    ? (preview ?? { hasExport: true, hasProps: false, hasRender: false })
    : { hasExport: false, hasProps: false, hasRender: false };
  const renderSelection = selectRenderTarget({
    candidateExportNames,
    exportedRenderableCandidates,
    hasDefaultComponent,
    preview: resolvedPreview,
  });

  return {
    filePath: options.filePath,
    relativePath: path.relative(resolveRealFilePath(options.sourceRoot), options.filePath).split(path.sep).join("/"),
    isTsx: options.filePath.endsWith(".tsx"),
    imports: [...imports].sort((left, right) => left.localeCompare(right)),
    diagnostics,
    discoveryDiagnostics: [...discoveryDiagnostics.values()].sort((left, right) => {
      if (left.relativeFile !== right.relativeFile) {
        return left.relativeFile.localeCompare(right.relativeFile);
      }

      return left.code.localeCompare(right.code);
    }),
    candidateExportNames,
    hasDefaultComponent,
    autoRenderCandidate: renderSelection.autoRenderCandidate,
    autoRenderReason: renderSelection.autoRenderReason,
    render: renderSelection.render,
    preview: resolvedPreview,
  };
}

function collectTransitiveDiagnostics(
  entryFilePath: string,
  recordsByPath: Map<string, SourceModuleRecord>,
  visited = new Set<string>(),
  collected = new Map<string, PreviewRegistryDiagnostic>(),
) {
  if (visited.has(entryFilePath)) {
    return collected;
  }

  visited.add(entryFilePath);
  const record = recordsByPath.get(entryFilePath);
  if (!record) {
    return collected;
  }

  for (const diagnostic of record.diagnostics) {
    const key = `${diagnostic.file}:${diagnostic.line}:${diagnostic.column}:${diagnostic.code}`;
    if (!collected.has(key)) {
      collected.set(key, diagnostic);
    }
  }

  for (const importPath of record.imports) {
    collectTransitiveDiagnostics(importPath, recordsByPath, visited, collected);
  }

  return collected;
}

function collectTransitiveDiscoveryDiagnostics(
  entryFilePath: string,
  recordsByPath: Map<string, SourceModuleRecord>,
  visited = new Set<string>(),
  collected = new Map<string, PreviewDiscoveryDiagnostic>(),
) {
  if (visited.has(entryFilePath)) {
    return collected;
  }

  visited.add(entryFilePath);
  const record = recordsByPath.get(entryFilePath);
  if (!record) {
    return collected;
  }

  for (const diagnostic of record.discoveryDiagnostics) {
    const key = `${diagnostic.code}:${diagnostic.relativeFile}:${diagnostic.message}`;
    if (!collected.has(key)) {
      collected.set(key, diagnostic);
    }
  }

  for (const importPath of record.imports) {
    collectTransitiveDiscoveryDiagnostics(importPath, recordsByPath, visited, collected);
  }

  return collected;
}

function createEntryDiscoveryDiagnostics(record: SourceModuleRecord, packageRoot: string, render: PreviewRenderTarget) {
  const diagnostics: PreviewDiscoveryDiagnostic[] = [];

  if (render.mode !== "none") {
    return diagnostics;
  }

  if (record.preview.hasExport && !record.preview.hasRender) {
    diagnostics.push(
      createDiscoveryDiagnostic(
        packageRoot,
        record.filePath,
        "PREVIEW_RENDER_MISSING",
        "The file exports `preview`, but it does not define a callable `preview.render`.",
      ),
    );
  }

  if (render.reason === "no-component-export") {
    diagnostics.push(
      createDiscoveryDiagnostic(
        packageRoot,
        record.filePath,
        "NO_COMPONENT_EXPORTS",
        "No exported component candidates were found for auto-render.",
      ),
    );
  }

  if (render.reason === "ambiguous-exports") {
    diagnostics.push(
      createDiscoveryDiagnostic(
        packageRoot,
        record.filePath,
        "AMBIGUOUS_COMPONENT_EXPORTS",
        `Multiple component exports need explicit disambiguation: ${(render.candidates ?? record.candidateExportNames).join(", ")}.`,
      ),
    );
  }

  return diagnostics;
}

function getEntryStatus(
  diagnostics: PreviewRegistryDiagnostic[],
  render: PreviewRenderTarget,
) {
  if (diagnostics.length > 0) {
    return "error" as const;
  }

  if (render.mode !== "none") {
    return "ready" as const;
  }

  return "needs-harness" as const;
}

function isPreviewPackageInternalEntry(packageRoot: string, relativePath: string) {
  const previewPackageRoot = resolveRealFilePath(path.resolve(__dirname, "../.."));
  if (resolveRealFilePath(packageRoot) !== previewPackageRoot) {
    return false;
  }

  return PREVIEW_PACKAGE_ENTRY_EXCLUDES.some((prefix) => relativePath.startsWith(prefix));
}

function createRegistryItem(
  record: SourceModuleRecord,
  recordsByPath: Map<string, SourceModuleRecord>,
  packageRoot: string,
  targetName: string,
  packageName: string,
): PreviewRegistryItem {
  const diagnostics = [...collectTransitiveDiagnostics(record.filePath, recordsByPath).values()].sort((left, right) => {
    if (left.relativeFile !== right.relativeFile) {
      return left.relativeFile.localeCompare(right.relativeFile);
    }

    if (left.line !== right.line) {
      return left.line - right.line;
    }

    return left.column - right.column;
  });
  const render = record.render;
  const discoveryDiagnostics = [
    ...collectTransitiveDiscoveryDiagnostics(record.filePath, recordsByPath).values(),
    ...createEntryDiscoveryDiagnostics(record, packageRoot, render),
  ].sort((left, right) => {
    if (left.relativeFile !== right.relativeFile) {
      return left.relativeFile.localeCompare(right.relativeFile);
    }

    if (left.code !== right.code) {
      return left.code.localeCompare(right.code);
    }

    return left.message.localeCompare(right.message);
  });
  const status = getEntryStatus(diagnostics, render);
  const title = record.preview.title?.trim() ? record.preview.title.trim() : humanizeTitle(record.relativePath);

  return {
    id: record.relativePath,
    packageName,
    relativePath: record.relativePath,
    sourceFilePath: record.filePath,
    targetName,
    title,
    status,
    render,
    candidateExportNames: [...record.candidateExportNames],
    autoRenderCandidate: record.autoRenderCandidate,
    autoRenderReason: record.autoRenderReason,
    exportNames: record.hasDefaultComponent ? ["default", ...record.candidateExportNames] : [...record.candidateExportNames],
    hasDefaultExport: record.hasDefaultComponent,
    hasPreviewExport: record.preview.hasExport,
    diagnostics,
    discoveryDiagnostics,
  };
}

export function discoverPreviewProject(options: DiscoverPreviewProjectOptions): PreviewProject {
  const packageName = options.packageName ?? path.basename(options.packageRoot);
  const sourceFiles = listSourceFiles(options.sourceRoot);
  const tsconfigCache: ParsedConfigCache = new Map();
  const records = sourceFiles.map((filePath) =>
    analyzeSourceModule({
      filePath,
      packageName,
      packageRoot: options.packageRoot,
      sourceRoot: options.sourceRoot,
      tsconfigCache,
    }),
  );
  const recordsByPath = new Map(records.map((record) => [record.filePath, record] as const));
  const entries = records
    .filter((record) => record.isTsx)
    .filter((record) => !isPreviewPackageInternalEntry(options.packageRoot, record.relativePath))
    .map((record) => createRegistryItem(record, recordsByPath, options.packageRoot, packageName, packageName))
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath));

  return {
    packageName,
    packageRoot: options.packageRoot,
    sourceRoot: options.sourceRoot,
    entries,
  };
}

export function discoverPreviewWorkspace(options: DiscoverPreviewWorkspaceOptions): PreviewWorkspace {
  const targets = options.targets.map((target) => ({
    ...target,
    packageName: target.packageName ?? target.name,
  }));
  const entries = targets
    .flatMap((target) => {
      const project = discoverPreviewProject({
        packageName: target.packageName,
        packageRoot: target.packageRoot,
        sourceRoot: target.sourceRoot,
      });

      return project.entries.map((entry) => ({
        ...entry,
        id: `${target.name}:${entry.relativePath}`,
        packageName: target.packageName ?? target.name,
        targetName: target.name,
      }));
    })
    .sort((left, right) => {
      if (left.targetName !== right.targetName) {
        return left.targetName.localeCompare(right.targetName);
      }

      return left.relativePath.localeCompare(right.relativePath);
    });

  return {
    projectName: options.projectName,
    entries,
    targets,
  };
}
