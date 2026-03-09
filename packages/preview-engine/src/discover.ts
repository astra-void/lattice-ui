import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { applyLegacyInferenceAdapter } from "./compat";
import { isFilePathUnderRoot, resolveRealFilePath } from "./pathUtils";
import { PREVIEW_ENGINE_PROTOCOL_VERSION } from "./types";
import type {
  CreatePreviewEngineOptions,
  PreviewAutoRenderSelectionReason,
  PreviewDiagnostic,
  PreviewDiscoveryDiagnosticCode,
  PreviewEntryDescriptor,
  PreviewEntryStatus,
  PreviewGraphImportEdge,
  PreviewGraphTrace,
  PreviewRenderTarget,
  PreviewSelection,
  PreviewSelectionMode,
  PreviewSourceTarget,
  PreviewWorkspaceIndex,
} from "./types";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const DEFAULT_COMPILER_OPTIONS: ts.CompilerOptions = {
  jsx: ts.JsxEmit.Preserve,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
  target: ts.ScriptTarget.ESNext,
};
const PREVIEW_PACKAGE_ENTRY_EXCLUDES = ["runtime/", "shell/"];

type PreviewExportInfo = {
  entryLocalName?: string;
  hasEntry: boolean;
  hasExport: boolean;
  hasProps: boolean;
  hasRender: boolean;
  title?: string;
};

type LocalRenderableDeclarationKind =
  | "function-declaration"
  | "variable-arrow"
  | "variable-function"
  | "variable-other";

type LocalRenderableMetadata = {
  declarationKind: LocalRenderableDeclarationKind;
  isRenderable: boolean;
  matchesFileBasename: boolean;
  name: string;
};

type ImportBinding = {
  importedName: "default" | string;
  sourceFilePath: string;
};

type ExportBinding =
  | {
      kind: "default-expression";
    }
  | {
      kind: "local";
      localName: string;
    }
  | {
      importedName: "default" | string;
      kind: "re-export";
      sourceFilePath: string;
    };

type RawDiagnostic = Omit<PreviewDiagnostic, "entryId" | "relativeFile">;

type TargetContext = {
  packageName: string;
  packageRoot: string;
  parsedConfig?: ts.ParsedCommandLine;
  sourceRoot: string;
  targetName: string;
  workspaceRoot: string;
};

type RawSourceModuleRecord = {
  exportAllSources: string[];
  exportBindings: Map<string, ExportBinding[]>;
  filePath: string;
  graphEdges: PreviewGraphImportEdge[];
  importBindings: Map<string, ImportBinding>;
  imports: string[];
  isTsx: boolean;
  localRenderableMetadata: Map<string, LocalRenderableMetadata>;
  preview: PreviewExportInfo;
  previewExported: boolean;
  rawDiagnostics: RawDiagnostic[];
  relativePath: string;
  target: TargetContext;
};

type ResolvedRenderableRef = {
  importChain: string[];
  originFilePath: string;
  symbolChain: string[];
  symbolName: string;
};

export type DiscoveredEntryState = {
  dependencyPaths: string[];
  descriptor: PreviewEntryDescriptor;
  discoveryDiagnostics: PreviewDiagnostic[];
  graphTrace: PreviewGraphTrace;
  packageRoot: string;
  previewHasProps: boolean;
  target: TargetContext;
};

export type WorkspaceDiscoverySnapshot = {
  entryDependencyPathsById: Map<string, string[]>;
  entryStatesById: Map<string, DiscoveredEntryState>;
  workspaceIndex: PreviewWorkspaceIndex;
};

type ResolveModuleImportOptions = {
  importerFilePath: string;
  parsedConfig?: ts.ParsedCommandLine;
  specifier: string;
  workspaceRoot: string;
};

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

function listTargetEntryFiles(target: Pick<PreviewSourceTarget, "sourceRoot">, parsedConfig?: ts.ParsedCommandLine) {
  const sourceRoot = resolveRealFilePath(target.sourceRoot);
  const programFiles =
    parsedConfig?.fileNames
      .map((fileName) => resolveRealFilePath(fileName))
      .filter((fileName) => isTransformableSourceFile(fileName) && isFilePathUnderRoot(sourceRoot, fileName)) ?? [];

  if (programFiles.length > 0) {
    return [...new Set(programFiles)].sort((left, right) => left.localeCompare(right));
  }

  return listSourceFiles(sourceRoot);
}

function toRelativePath(rootPath: string, filePath: string) {
  return path.relative(resolveRealFilePath(rootPath), resolveRealFilePath(filePath)).split(path.sep).join("/");
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

  let entryLocalName: string | undefined;
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

    if (propertyName === "entry" && ts.isPropertyAssignment(property) && ts.isIdentifier(property.initializer)) {
      entryLocalName = property.initializer.text;
      continue;
    }

    if (propertyName === "render") {
      hasRender = true;
    }
  }

  return {
    entryLocalName,
    hasEntry: entryLocalName !== undefined,
    hasExport: true,
    hasProps,
    hasRender,
    title,
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

function getParsedTsconfig(sourceRoot: string) {
  const tsconfigPath = findNearestTsconfig(sourceRoot);
  return tsconfigPath ? parseTsconfig(tsconfigPath) : undefined;
}

function findWorkspaceRoot(startPath: string) {
  let current = resolveRealFilePath(startPath);

  while (true) {
    if (fs.existsSync(path.join(current, "pnpm-workspace.yaml")) || fs.existsSync(path.join(current, ".git"))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return resolveRealFilePath(startPath);
    }

    current = parent;
  }
}

function findNearestPackageRoot(filePath: string) {
  let current = fs.existsSync(filePath) && fs.statSync(filePath).isDirectory() ? filePath : path.dirname(filePath);

  while (true) {
    if (fs.existsSync(path.join(current, "package.json"))) {
      return resolveRealFilePath(current);
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return resolveRealFilePath(path.dirname(filePath));
    }

    current = parent;
  }
}

function shouldReportTransitiveLimit(options: {
  parsedConfig?: ts.ParsedCommandLine;
  resolvedFilePath?: string;
  specifier: string;
  workspaceRoot: string;
}) {
  if (options.specifier.startsWith(".")) {
    return true;
  }

  if (options.resolvedFilePath && isFilePathUnderRoot(options.workspaceRoot, options.resolvedFilePath)) {
    return true;
  }

  if (!options.resolvedFilePath && (options.parsedConfig?.options.baseUrl || options.parsedConfig?.options.paths)) {
    return true;
  }

  return false;
}

function createRawDiagnostic(
  code: PreviewDiscoveryDiagnosticCode,
  file: string,
  summary: string,
  target: string,
  severity: PreviewDiagnostic["severity"] = "warning",
  importChain?: string[],
): RawDiagnostic {
  return {
    code,
    file,
    importChain,
    phase: "discovery",
    severity,
    summary,
    target,
  };
}

function resolveModuleImport(options: ResolveModuleImportOptions) {
  const compilerOptions = options.parsedConfig?.options ?? DEFAULT_COMPILER_OPTIONS;
  const resolution = ts.resolveModuleName(options.specifier, options.importerFilePath, compilerOptions, ts.sys);
  const resolvedFilePath = resolution.resolvedModule?.resolvedFileName
    ? resolveRealFilePath(resolution.resolvedModule.resolvedFileName)
    : undefined;

  if (!resolvedFilePath) {
    return shouldReportTransitiveLimit({
      parsedConfig: options.parsedConfig,
      specifier: options.specifier,
      workspaceRoot: options.workspaceRoot,
    })
      ? {
          diagnostic: createRawDiagnostic(
            "TRANSITIVE_ANALYSIS_LIMITED",
            options.importerFilePath,
            `Transitive analysis stopped at ${JSON.stringify(options.specifier)}: ` +
              `it could not be resolved from ${options.importerFilePath}.`,
            "preview-engine",
            "warning",
            [options.importerFilePath],
          ),
          edge: {
            crossesPackageBoundary: false,
            importerFile: options.importerFilePath,
            resolution: "stopped" as const,
            specifier: options.specifier,
            stopReason: "unresolved-import",
          },
        }
      : undefined;
  }

  if (!isTransformableSourceFile(resolvedFilePath)) {
    return shouldReportTransitiveLimit({
      parsedConfig: options.parsedConfig,
      resolvedFilePath,
      specifier: options.specifier,
      workspaceRoot: options.workspaceRoot,
    })
      ? {
          diagnostic: createRawDiagnostic(
            "TRANSITIVE_ANALYSIS_LIMITED",
            options.importerFilePath,
            `Transitive analysis stopped at ${JSON.stringify(options.specifier)}: ` +
              `it resolves to a non-transformable file (${resolvedFilePath}).`,
            "preview-engine",
            "warning",
            [options.importerFilePath],
          ),
          edge: {
            crossesPackageBoundary: false,
            importerFile: options.importerFilePath,
            resolution: "stopped" as const,
            resolvedFile: resolvedFilePath,
            specifier: options.specifier,
            stopReason: "non-transformable-import",
          },
        }
      : undefined;
  }

  if (!isFilePathUnderRoot(options.workspaceRoot, resolvedFilePath)) {
    return {
      diagnostic: createRawDiagnostic(
        "TRANSITIVE_ANALYSIS_LIMITED",
        options.importerFilePath,
        `Transitive analysis stopped at ${JSON.stringify(options.specifier)}: ` +
          `it resolves outside the current workspace (${resolvedFilePath}).`,
        "preview-engine",
        "warning",
        [options.importerFilePath],
      ),
      edge: {
        crossesPackageBoundary: false,
        importerFile: options.importerFilePath,
        resolution: "stopped" as const,
        resolvedFile: resolvedFilePath,
        specifier: options.specifier,
        stopReason: "outside-workspace",
      },
    };
  }

  return {
    edge: {
      crossesPackageBoundary:
        findNearestPackageRoot(options.importerFilePath) !== findNearestPackageRoot(resolvedFilePath),
      importerFile: options.importerFilePath,
      resolution: "resolved" as const,
      resolvedFile: resolvedFilePath,
      specifier: options.specifier,
    },
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
        declarationKind: "function-declaration",
        isRenderable: true,
        matchesFileBasename: statement.name.text === fileBasename,
        name: statement.name.text,
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
          declarationKind: getVariableDeclarationKind(declaration.initializer),
          isRenderable: isRenderableInitializer(declaration.initializer),
          matchesFileBasename: declaration.name.text === fileBasename,
          name: declaration.name.text,
        });
      }
    }
  }

  return {
    localPreviewInfo,
    localRenderableMetadata,
  };
}

function parseModuleRecord(filePath: string, target: TargetContext): RawSourceModuleRecord {
  const sourceText = fs.readFileSync(filePath, "utf8");
  const scriptKind = filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, scriptKind);
  const { localPreviewInfo, localRenderableMetadata } = collectLocalRenderableNames(sourceFile);
  const importBindings = new Map<string, ImportBinding>();
  const exportBindings = new Map<string, ExportBinding[]>();
  const exportAllSources: string[] = [];
  const graphEdges: PreviewGraphImportEdge[] = [];
  const imports = new Set<string>();
  const rawDiagnostics = new Map<string, RawDiagnostic>();
  let previewExported = false;
  let preview = localPreviewInfo;

  const addDiagnostic = (diagnostic: RawDiagnostic) => {
    const key = `${diagnostic.code}:${diagnostic.file}:${diagnostic.summary}`;
    rawDiagnostics.set(key, diagnostic);
  };

  const addExportBinding = (exportName: string, binding: ExportBinding) => {
    const bindings = exportBindings.get(exportName) ?? [];
    bindings.push(binding);
    exportBindings.set(exportName, bindings);
  };

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
      const resolvedImport = resolveModuleImport({
        importerFilePath: filePath,
        parsedConfig: target.parsedConfig,
        specifier: statement.moduleSpecifier.text,
        workspaceRoot: target.workspaceRoot,
      });

      if (resolvedImport?.edge) {
        graphEdges.push(resolvedImport.edge);
      }

      if (resolvedImport?.diagnostic) {
        addDiagnostic(resolvedImport.diagnostic);
      }

      if (resolvedImport?.resolvedImport) {
        imports.add(resolvedImport.resolvedImport);
        const clause = statement.importClause;
        if (clause?.name) {
          importBindings.set(clause.name.text, {
            importedName: "default",
            sourceFilePath: resolvedImport.resolvedImport,
          });
        }

        if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
          for (const element of clause.namedBindings.elements) {
            importBindings.set(element.name.text, {
              importedName: element.propertyName?.text ?? element.name.text,
              sourceFilePath: resolvedImport.resolvedImport,
            });
          }
        }
      }

      continue;
    }

    if (ts.isFunctionDeclaration(statement) && isExported(statement)) {
      if (statement.name?.text === "preview") {
        previewExported = true;
      } else if (statement.name) {
        addExportBinding(isDefaultExport(statement) ? "default" : statement.name.text, {
          kind: "local",
          localName: statement.name.text,
        });
      } else if (isDefaultExport(statement)) {
        addExportBinding("default", { kind: "default-expression" });
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
              hasEntry: false,
              hasExport: true,
              hasProps: false,
              hasRender: false,
            };
          continue;
        }

        if (!isExported(statement)) {
          continue;
        }

        addExportBinding(isDefaultExport(statement) ? "default" : declaration.name.text, {
          kind: "local",
          localName: declaration.name.text,
        });
      }
      continue;
    }

    if (ts.isExportAssignment(statement)) {
      if (ts.isIdentifier(statement.expression)) {
        addExportBinding("default", {
          kind: "local",
          localName: statement.expression.text,
        });
      } else if (ts.isArrowFunction(statement.expression) || ts.isFunctionExpression(statement.expression)) {
        addExportBinding("default", { kind: "default-expression" });
      }
      continue;
    }

    if (!ts.isExportDeclaration(statement) || statement.isTypeOnly || !statement.moduleSpecifier) {
      if (ts.isExportDeclaration(statement) && !statement.isTypeOnly && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) {
          const localName = element.propertyName?.text ?? element.name.text;
          const exportName = element.name.text;
          if (localName === "preview") {
            previewExported = true;
            continue;
          }

          addExportBinding(exportName, {
            kind: "local",
            localName,
          });
        }
      }
      continue;
    }

    if (!ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }

    const resolvedImport = resolveModuleImport({
      importerFilePath: filePath,
      parsedConfig: target.parsedConfig,
      specifier: statement.moduleSpecifier.text,
      workspaceRoot: target.workspaceRoot,
    });

    if (resolvedImport?.edge) {
      graphEdges.push(resolvedImport.edge);
    }

    if (resolvedImport?.diagnostic) {
      addDiagnostic(resolvedImport.diagnostic);
    }

    if (!resolvedImport?.resolvedImport) {
      continue;
    }

    imports.add(resolvedImport.resolvedImport);

    if (!statement.exportClause) {
      exportAllSources.push(resolvedImport.resolvedImport);
      continue;
    }

    if (!ts.isNamedExports(statement.exportClause)) {
      continue;
    }

    for (const element of statement.exportClause.elements) {
      const importedName = element.propertyName?.text ?? element.name.text;
      const exportName = element.name.text;
      if (importedName === "preview") {
        previewExported = true;
        continue;
      }

      addExportBinding(exportName, {
        importedName,
        kind: "re-export",
        sourceFilePath: resolvedImport.resolvedImport,
      });
    }
  }

  return {
    exportAllSources,
    exportBindings,
    filePath,
    graphEdges,
    importBindings,
    imports: [...imports].sort((left, right) => left.localeCompare(right)),
    isTsx: filePath.endsWith(".tsx"),
    localRenderableMetadata,
    preview:
      previewExported
        ? (preview ?? { hasEntry: false, hasExport: true, hasProps: false, hasRender: false })
        : { hasEntry: false, hasExport: false, hasProps: false, hasRender: false },
    previewExported,
    rawDiagnostics: [...rawDiagnostics.values()],
    relativePath: toRelativePath(target.sourceRoot, filePath),
    target,
  };
}

function resolveLocalReference(
  record: RawSourceModuleRecord,
  localName: string,
  recordsByPath: Map<string, RawSourceModuleRecord>,
  stack = new Set<string>(),
): ResolvedRenderableRef | undefined {
  const localMetadata = record.localRenderableMetadata.get(localName);
  if (localMetadata?.isRenderable) {
    return {
      importChain: [record.filePath],
      originFilePath: record.filePath,
      symbolChain: [`${record.filePath}#${localName}`],
      symbolName: localName,
    };
  }

  const importBinding = record.importBindings.get(localName);
  if (!importBinding) {
    return undefined;
  }

  const sourceRecord = recordsByPath.get(importBinding.sourceFilePath);
  if (!sourceRecord) {
    return undefined;
  }

  const resolved = resolveExportReference(sourceRecord, importBinding.importedName, recordsByPath, stack);
  if (!resolved) {
    return undefined;
  }

  return {
    importChain: [record.filePath, ...resolved.importChain],
    originFilePath: resolved.originFilePath,
    symbolChain: [`${record.filePath}#${localName}`, ...resolved.symbolChain],
    symbolName: resolved.symbolName,
  };
}

function resolveExportReference(
  record: RawSourceModuleRecord,
  exportName: string,
  recordsByPath: Map<string, RawSourceModuleRecord>,
  stack = new Set<string>(),
): ResolvedRenderableRef | undefined {
  const stackKey = `${record.filePath}:${exportName}`;
  if (stack.has(stackKey)) {
    return undefined;
  }

  stack.add(stackKey);

  const bindings = record.exportBindings.get(exportName) ?? [];
  for (const binding of bindings) {
    if (binding.kind === "default-expression") {
      stack.delete(stackKey);
      return {
        importChain: [record.filePath],
        originFilePath: record.filePath,
        symbolChain: [`${record.filePath}#default`],
        symbolName: "default",
      };
    }

    if (binding.kind === "local") {
      const resolved = resolveLocalReference(record, binding.localName, recordsByPath, stack);
      if (resolved) {
        stack.delete(stackKey);
        return {
          ...resolved,
          symbolChain: [`${record.filePath}#${exportName}`, ...resolved.symbolChain],
        };
      }
      continue;
    }

    const sourceRecord = recordsByPath.get(binding.sourceFilePath);
    if (!sourceRecord) {
      continue;
    }

    const resolved = resolveExportReference(sourceRecord, binding.importedName, recordsByPath, stack);
    if (resolved) {
      stack.delete(stackKey);
      return {
        importChain: [record.filePath, ...resolved.importChain],
        originFilePath: resolved.originFilePath,
        symbolChain: [`${record.filePath}#${exportName}`, ...resolved.symbolChain],
        symbolName: resolved.symbolName,
      };
    }
  }

  if (exportName !== "default") {
    for (const sourceFilePath of record.exportAllSources) {
      const sourceRecord = recordsByPath.get(sourceFilePath);
      if (!sourceRecord) {
        continue;
      }

      const resolved = resolveExportReference(sourceRecord, exportName, recordsByPath, stack);
      if (resolved) {
        stack.delete(stackKey);
        return {
          importChain: [record.filePath, ...resolved.importChain],
          originFilePath: resolved.originFilePath,
          symbolChain: [`${record.filePath}#${exportName}`, ...resolved.symbolChain],
          symbolName: resolved.symbolName,
        };
      }
    }
  }

  stack.delete(stackKey);
  return undefined;
}

function getRenderableNamedExports(record: RawSourceModuleRecord, recordsByPath: Map<string, RawSourceModuleRecord>) {
  const renderableExports = new Set<string>();
  for (const exportName of record.exportBindings.keys()) {
    if (exportName === "default" || exportName === "preview") {
      continue;
    }

    if (resolveExportReference(record, exportName, recordsByPath)) {
      renderableExports.add(exportName);
    }
  }

  for (const sourceFilePath of record.exportAllSources) {
    const sourceRecord = recordsByPath.get(sourceFilePath);
    if (!sourceRecord) {
      continue;
    }

    for (const exportName of getRenderableNamedExports(sourceRecord, recordsByPath)) {
      renderableExports.add(exportName);
    }
  }

  return [...renderableExports].sort((left, right) => left.localeCompare(right));
}

function hasRenderableDefaultExport(record: RawSourceModuleRecord, recordsByPath: Map<string, RawSourceModuleRecord>) {
  return resolveExportReference(record, "default", recordsByPath) !== undefined;
}

function resolvePreviewEntryExport(record: RawSourceModuleRecord, recordsByPath: Map<string, RawSourceModuleRecord>) {
  const entryLocalName = record.preview.entryLocalName;
  if (!entryLocalName) {
    return undefined;
  }

  const resolvedEntry = resolveLocalReference(record, entryLocalName, recordsByPath);
  if (!resolvedEntry) {
    return undefined;
  }

  const exportNames: string[] = [];
  const candidates = record.exportBindings.has("default")
    ? ["default", ...getRenderableNamedExports(record, recordsByPath)]
    : getRenderableNamedExports(record, recordsByPath);

  for (const exportName of candidates) {
    const resolvedExport = resolveExportReference(record, exportName, recordsByPath);
    if (
      resolvedExport &&
      resolvedExport.originFilePath === resolvedEntry.originFilePath &&
      resolvedExport.symbolName === resolvedEntry.symbolName
    ) {
      exportNames.push(exportName);
    }
  }

  if (exportNames.length === 0) {
    return undefined;
  }

  if (exportNames.includes(entryLocalName)) {
    return {
      exportName: entryLocalName,
      trace: resolvedEntry,
    };
  }

  if (exportNames.length === 1) {
    return {
      exportName: exportNames[0]!,
      trace: resolvedEntry,
    };
  }

  if (exportNames.includes("default")) {
    return {
      exportName: "default",
      trace: resolvedEntry,
    };
  }

  return {
    exportName: exportNames[0]!,
    trace: resolvedEntry,
  };
}

function collectTransitivePaths(
  filePath: string,
  recordsByPath: Map<string, RawSourceModuleRecord>,
  visited = new Set<string>(),
  collected: string[] = [],
) {
  if (visited.has(filePath)) {
    return collected;
  }

  visited.add(filePath);
  collected.push(filePath);

  const record = recordsByPath.get(filePath);
  if (!record) {
    return collected;
  }

  for (const importPath of record.imports) {
    collectTransitivePaths(importPath, recordsByPath, visited, collected);
  }

  return collected;
}

function collectTransitiveDiagnostics(
  entryId: string,
  packageRoot: string,
  filePath: string,
  recordsByPath: Map<string, RawSourceModuleRecord>,
  visited = new Set<string>(),
  diagnostics = new Map<string, PreviewDiagnostic>(),
) {
  if (visited.has(filePath)) {
    return diagnostics;
  }

  visited.add(filePath);
  const record = recordsByPath.get(filePath);
  if (!record) {
    return diagnostics;
  }

  for (const diagnostic of record.rawDiagnostics) {
    const nextDiagnostic: PreviewDiagnostic = {
      ...diagnostic,
      entryId,
      relativeFile: toRelativePath(packageRoot, diagnostic.file),
    };
    const key = `${nextDiagnostic.code}:${nextDiagnostic.file}:${nextDiagnostic.summary}`;
    diagnostics.set(key, nextDiagnostic);
  }

  for (const importPath of record.imports) {
    collectTransitiveDiagnostics(entryId, packageRoot, importPath, recordsByPath, visited, diagnostics);
  }

  return diagnostics;
}

function collectTransitiveGraphTrace(
  entryFilePath: string,
  recordsByPath: Map<string, RawSourceModuleRecord>,
  selectionTrace: PreviewGraphTrace["selection"],
) {
  const visited = new Set<string>();
  const imports = new Map<string, PreviewGraphImportEdge>();
  const boundaryHops = new Map<string, PreviewGraphTrace["boundaryHops"][number]>();
  let stopReason: string | undefined;

  const visit = (filePath: string) => {
    if (visited.has(filePath)) {
      return;
    }

    visited.add(filePath);
    const record = recordsByPath.get(filePath);
    if (!record) {
      return;
    }

    for (const edge of record.graphEdges) {
      const key = `${edge.importerFile}:${edge.specifier}:${edge.resolvedFile ?? edge.stopReason ?? "none"}`;
      imports.set(key, edge);
      if (!stopReason && edge.stopReason) {
        stopReason = edge.stopReason;
      }

      if (edge.crossesPackageBoundary && edge.resolvedFile) {
        const hop = {
          fromFile: edge.importerFile,
          fromPackageRoot: findNearestPackageRoot(edge.importerFile),
          toFile: edge.resolvedFile,
          toPackageRoot: findNearestPackageRoot(edge.resolvedFile),
        };
        boundaryHops.set(`${hop.fromFile}:${hop.toFile}`, hop);
      }
    }

    for (const importPath of record.imports) {
      visit(importPath);
    }
  };

  visit(entryFilePath);

  return {
    boundaryHops: [...boundaryHops.values()].sort((left, right) => left.toFile.localeCompare(right.toFile)),
    imports: [...imports.values()].sort((left, right) => {
      if (left.importerFile !== right.importerFile) {
        return left.importerFile.localeCompare(right.importerFile);
      }

      return left.specifier.localeCompare(right.specifier);
    }),
    selection: selectionTrace,
    ...(stopReason ? { stopReason } : {}),
  } satisfies PreviewGraphTrace;
}

function createEntryDiagnostic(
  code: PreviewDiscoveryDiagnosticCode,
  entryId: string,
  filePath: string,
  packageRoot: string,
  summary: string,
  severity: PreviewDiagnostic["severity"] = "warning",
) {
  return {
    code,
    entryId,
    file: filePath,
    phase: "discovery",
    relativeFile: toRelativePath(packageRoot, filePath),
    severity,
    summary,
    target: "preview-engine",
  } satisfies PreviewDiagnostic;
}

function createDiagnosticsSummary(diagnostics: PreviewDiagnostic[]) {
  const byPhase = {
    discovery: 0,
    layout: 0,
    runtime: 0,
    transform: 0,
  } satisfies Record<PreviewDiagnostic["phase"], number>;

  for (const diagnostic of diagnostics) {
    byPhase[diagnostic.phase] += 1;
  }

  return {
    byPhase,
    hasBlocking: diagnostics.some((diagnostic) => diagnostic.severity === "error"),
    total: diagnostics.length,
  };
}

function createCapabilities(renderTarget: PreviewRenderTarget) {
  return {
    supportsHotUpdate: true,
    supportsLayoutDebug: true,
    supportsPropsEditing: renderTarget.kind === "component",
    supportsRuntimeMock: true,
  };
}

function createExplicitSelection(record: RawSourceModuleRecord, recordsByPath: Map<string, RawSourceModuleRecord>) {
  if (record.preview.hasRender) {
    return {
      renderTarget: {
        contract: "preview.render",
        kind: "harness",
      } satisfies PreviewRenderTarget,
      selection: {
        contract: "preview.render",
        kind: "explicit",
      } satisfies PreviewSelection,
      trace: {
        contract: "preview.render" as const,
        importChain: [record.filePath],
        symbolChain: [`${record.filePath}#preview.render`],
      },
    };
  }

  const resolvedEntry = resolvePreviewEntryExport(record, recordsByPath);
  if (resolvedEntry) {
    return {
      renderTarget: {
        exportName: resolvedEntry.exportName,
        kind: "component",
        usesPreviewProps: record.preview.hasProps,
      } satisfies PreviewRenderTarget,
      selection: {
        contract: "preview.entry",
        kind: "explicit",
      } satisfies PreviewSelection,
      trace: {
        contract: "preview.entry" as const,
        importChain: resolvedEntry.trace.importChain,
        requestedSymbol: record.preview.entryLocalName,
        resolvedExportName: resolvedEntry.exportName,
        symbolChain: resolvedEntry.trace.symbolChain,
      },
    };
  }

  return undefined;
}

function isPreviewPackageInternalEntry(packageRoot: string, relativePath: string) {
  const previewPackageRoot = resolveRealFilePath(path.resolve(__dirname, "../../preview"));
  if (resolveRealFilePath(packageRoot) !== previewPackageRoot) {
    return false;
  }

  return PREVIEW_PACKAGE_ENTRY_EXCLUDES.some((prefix) => relativePath.startsWith(prefix));
}

function buildDescriptor(
  record: RawSourceModuleRecord,
  recordsByPath: Map<string, RawSourceModuleRecord>,
  selectionMode: PreviewSelectionMode,
): {
  dependencyPaths: string[];
  descriptor: PreviewEntryDescriptor;
  discoveryDiagnostics: PreviewDiagnostic[];
  graphTrace: PreviewGraphTrace;
} {
  const explicitSelection = createExplicitSelection(record, recordsByPath);
  const candidateExportNames = getRenderableNamedExports(record, recordsByPath);
  const hasDefaultExport = hasRenderableDefaultExport(record, recordsByPath);
  const entryId = `${record.target.targetName}:${record.relativePath}`;
  const baseDiagnostics = [
    ...collectTransitiveDiagnostics(entryId, record.target.packageRoot, record.filePath, recordsByPath).values(),
  ];
  const compatClassification = applyLegacyInferenceAdapter({
    candidateExportNames,
    entryId,
    filePath: record.filePath,
    graphTrace: {
      boundaryHops: [],
      imports: [],
      selection: {
        importChain: [record.filePath],
        symbolChain: [],
      },
    },
    hasDefaultExport,
    packageRoot: record.target.packageRoot,
    previewHasProps: record.preview.hasProps,
  });

  let selection: PreviewSelection;
  let renderTarget: PreviewRenderTarget;
  let status: PreviewEntryStatus;
  let selectionTrace: PreviewGraphTrace["selection"];
  const entryDiagnostics = [...baseDiagnostics];

  if (explicitSelection) {
    selection = explicitSelection.selection;
    renderTarget = explicitSelection.renderTarget;
    selectionTrace = explicitSelection.trace;
    status = "ready";
  } else if (selectionMode === "compat" && compatClassification) {
    selection = compatClassification.selection;
    renderTarget = compatClassification.renderTarget;
    selectionTrace = {
      importChain: [record.filePath],
      resolvedExportName: compatClassification.autoRenderCandidate,
      symbolChain: [`${record.filePath}#${compatClassification.autoRenderCandidate ?? "compat"}`],
    };
    status = "ready";
    entryDiagnostics.push(...compatClassification.diagnostics);
  } else if (compatClassification) {
    selection = {
      kind: "unresolved",
      reason: "missing-explicit-contract",
    };
    renderTarget = {
      candidates: hasDefaultExport ? ["default", ...candidateExportNames] : [...candidateExportNames],
      kind: "none",
      reason: "missing-explicit-contract",
    };
    selectionTrace = {
      importChain: [record.filePath],
      requestedSymbol: record.preview.entryLocalName,
      symbolChain: [],
    };
    status = "needs_harness";
    entryDiagnostics.push(
      createEntryDiagnostic(
        "MISSING_EXPLICIT_PREVIEW_CONTRACT",
        entryId,
        record.filePath,
        record.target.packageRoot,
        `This file does not declare \`preview.entry\` or \`preview.render\`. ` +
          `Compat mode would render it via ${compatClassification.autoRenderReason}.`,
      ),
    );
  } else if (candidateExportNames.length > 1) {
    selection = {
      kind: "unresolved",
      reason: "ambiguous-exports",
    };
    renderTarget = {
      candidates: [...candidateExportNames],
      kind: "none",
      reason: "ambiguous-exports",
    };
    selectionTrace = {
      importChain: [record.filePath],
      symbolChain: [],
    };
    status = "ambiguous";
    entryDiagnostics.push(
      createEntryDiagnostic(
        "AMBIGUOUS_COMPONENT_EXPORTS",
        entryId,
        record.filePath,
        record.target.packageRoot,
        `Multiple component exports need explicit disambiguation: ${candidateExportNames.join(", ")}.`,
      ),
    );
  } else {
    selection = {
      kind: "unresolved",
      reason: "no-component-export",
    };
    renderTarget = {
      kind: "none",
      reason: candidateExportNames.length > 0 || hasDefaultExport ? "missing-explicit-contract" : "no-component-export",
    };
    selectionTrace = {
      importChain: [record.filePath],
      symbolChain: [],
    };
    status = "needs_harness";
    if (candidateExportNames.length === 0 && !hasDefaultExport) {
      entryDiagnostics.push(
        createEntryDiagnostic(
          "NO_COMPONENT_EXPORTS",
          entryId,
          record.filePath,
          record.target.packageRoot,
          "No exported component candidates were found for preview entry selection.",
        ),
      );
    }
  }

  if (record.preview.hasExport && !record.preview.hasRender && !createExplicitSelection(record, recordsByPath)) {
    entryDiagnostics.push(
      createEntryDiagnostic(
        "PREVIEW_RENDER_MISSING",
        entryId,
        record.filePath,
        record.target.packageRoot,
        "The file exports `preview`, but it does not define a usable `preview.entry` or callable `preview.render`.",
      ),
    );
  }

  const graphTrace = collectTransitiveGraphTrace(record.filePath, recordsByPath, selectionTrace);
  const dependencyPaths = collectTransitivePaths(record.filePath, recordsByPath).sort((left, right) =>
    left.localeCompare(right),
  );
  const diagnosticsSummary = createDiagnosticsSummary(entryDiagnostics);
  const title = record.preview.title?.trim() ? record.preview.title.trim() : humanizeTitle(record.relativePath);
  const descriptor: PreviewEntryDescriptor = {
    capabilities: createCapabilities(renderTarget),
    candidateExportNames,
    diagnosticsSummary,
    hasDefaultExport,
    hasPreviewExport: record.preview.hasExport,
    id: entryId,
    packageName: record.target.packageName,
    relativePath: record.relativePath,
    renderTarget,
    selection,
    sourceFilePath: record.filePath,
    status,
    targetName: record.target.targetName,
    title,
  };

  return {
    dependencyPaths,
    descriptor,
    discoveryDiagnostics: entryDiagnostics.sort((left, right) => {
      if (left.relativeFile !== right.relativeFile) {
        return left.relativeFile.localeCompare(right.relativeFile);
      }

      return left.code.localeCompare(right.code);
    }),
    graphTrace,
  };
}

function createTargetContext(target: PreviewSourceTarget): TargetContext {
  return {
    packageName: target.packageName ?? target.name,
    packageRoot: resolveRealFilePath(target.packageRoot),
    parsedConfig: getParsedTsconfig(target.sourceRoot),
    sourceRoot: resolveRealFilePath(target.sourceRoot),
    targetName: target.name,
    workspaceRoot: findWorkspaceRoot(target.packageRoot),
  };
}

function discoverTargetRecords(target: TargetContext) {
  const recordsByPath = new Map<string, RawSourceModuleRecord>();
  const pending = [...listTargetEntryFiles(target, target.parsedConfig)];

  while (pending.length > 0) {
    const nextFilePath = pending.pop();
    if (!nextFilePath || recordsByPath.has(nextFilePath)) {
      continue;
    }

    const record = parseModuleRecord(nextFilePath, target);
    recordsByPath.set(nextFilePath, record);

    for (const importPath of record.imports) {
      if (!recordsByPath.has(importPath)) {
        pending.push(importPath);
      }
    }
  }

  return recordsByPath;
}

export function discoverWorkspaceState(options: Pick<CreatePreviewEngineOptions, "projectName" | "selectionMode" | "targets">) {
  const selectionMode = options.selectionMode ?? "compat";
  const entryStatesById = new Map<string, DiscoveredEntryState>();
  const entryDependencyPathsById = new Map<string, string[]>();
  const entries: PreviewEntryDescriptor[] = [];

  for (const target of options.targets.map(createTargetContext)) {
    const recordsByPath = discoverTargetRecords(target);
    const entryRecords = [...recordsByPath.values()]
      .filter((record) => record.isTsx)
      .filter((record) => isFilePathUnderRoot(target.sourceRoot, record.filePath))
      .filter((record) => !isPreviewPackageInternalEntry(target.packageRoot, record.relativePath));

    for (const record of entryRecords) {
      const builtEntry = buildDescriptor(record, recordsByPath, selectionMode);
      entries.push(builtEntry.descriptor);
      entryStatesById.set(builtEntry.descriptor.id, {
        dependencyPaths: builtEntry.dependencyPaths,
        descriptor: builtEntry.descriptor,
        discoveryDiagnostics: builtEntry.discoveryDiagnostics,
        graphTrace: builtEntry.graphTrace,
        packageRoot: target.packageRoot,
        previewHasProps: record.preview.hasProps,
        target,
      });
      entryDependencyPathsById.set(builtEntry.descriptor.id, builtEntry.dependencyPaths);
    }
  }

  entries.sort((left, right) => {
    if (left.targetName !== right.targetName) {
      return left.targetName.localeCompare(right.targetName);
    }

    return left.relativePath.localeCompare(right.relativePath);
  });

  return {
    entryDependencyPathsById,
    entryStatesById,
    workspaceIndex: {
      entries,
      projectName: options.projectName,
      protocolVersion: PREVIEW_ENGINE_PROTOCOL_VERSION,
      targets: options.targets.map((target) => ({
        ...target,
        packageName: target.packageName ?? target.name,
      })),
    },
  } satisfies WorkspaceDiscoverySnapshot;
}
