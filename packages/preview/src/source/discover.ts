import fs from "node:fs";
import path from "node:path";
import { transformPreviewSource } from "@lattice-ui/compiler";
import ts from "typescript";
import type {
  PreviewProject,
  PreviewRegistryDiagnostic,
  PreviewRegistryItem,
  PreviewRenderTarget,
  PreviewSourceTarget,
  PreviewWorkspace,
} from "./types";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

function isTransformableSourceFile(fileName: string) {
  return SOURCE_EXTENSIONS.has(path.extname(fileName)) && !fileName.endsWith(".d.ts") && !fileName.endsWith(".d.tsx");
}

type PreviewExportInfo = {
  title?: string;
  hasExport: boolean;
  hasProps: boolean;
  hasRender: boolean;
};

type SourceModuleRecord = {
  filePath: string;
  relativePath: string;
  isTsx: boolean;
  imports: string[];
  diagnostics: PreviewRegistryDiagnostic[];
  componentExports: string[];
  hasDefaultComponent: boolean;
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

const PREVIEW_PACKAGE_ENTRY_EXCLUDES = ["runtime/", "shell/"];

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
    throw new Error(`Failed to parse preview source ${options.filePath}: ${detail}`);
  }
}

function isUnderRoot(rootPath: string, filePath: string) {
  const relativePath = path.relative(rootPath, filePath);
  return relativePath.length > 0 && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
}

function toRelativeSourcePath(packageRoot: string, filePath: string) {
  return path.relative(packageRoot, filePath).split(path.sep).join("/");
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

function resolveRelativeImport(importerFilePath: string, sourceRoot: string, specifier: string) {
  if (!specifier.startsWith(".")) {
    return undefined;
  }

  const resolvedBase = path.resolve(path.dirname(importerFilePath), specifier);
  const candidates = [
    resolvedBase,
    `${resolvedBase}.ts`,
    `${resolvedBase}.tsx`,
    path.join(resolvedBase, "index.ts"),
    path.join(resolvedBase, "index.tsx"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile() && isUnderRoot(sourceRoot, candidate)) {
      return candidate;
    }
  }

  return undefined;
}

function collectLocalRenderableNames(sourceFile: ts.SourceFile) {
  const localRenderableNames = new Set<string>();
  let localPreviewInfo: PreviewExportInfo | undefined;

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name && isComponentName(statement.name.text)) {
      localRenderableNames.add(statement.name.text);
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

      if (isComponentName(declaration.name.text) && isRenderableInitializer(declaration.initializer)) {
        localRenderableNames.add(declaration.name.text);
      }
    }
  }

  return {
    localRenderableNames,
    localPreviewInfo,
  };
}

function analyzeSourceModule(options: {
  filePath: string;
  packageName: string;
  packageRoot: string;
  sourceRoot: string;
}): SourceModuleRecord {
  const sourceText = fs.readFileSync(options.filePath, "utf8");
  const scriptKind = options.filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(options.filePath, sourceText, ts.ScriptTarget.Latest, true, scriptKind);
  const { localRenderableNames, localPreviewInfo } = collectLocalRenderableNames(sourceFile);
  const namedExports = new Set<string>();
  const imports: string[] = [];
  let hasDefaultComponent = false;
  let previewExported = false;
  let preview = localPreviewInfo;

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      const resolvedImport = resolveRelativeImport(
        options.filePath,
        options.sourceRoot,
        statement.moduleSpecifier.text,
      );
      if (resolvedImport) {
        imports.push(resolvedImport);
      }
      continue;
    }

    if (ts.isFunctionDeclaration(statement) && statement.name && isExported(statement)) {
      if (statement.name.text === "preview") {
        previewExported = true;
      } else if (localRenderableNames.has(statement.name.text)) {
        if (isDefaultExport(statement)) {
          hasDefaultComponent = true;
        } else {
          namedExports.add(statement.name.text);
        }
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
            preview ?? { hasExport: true, hasProps: false, hasRender: false };
          continue;
        }

        if (!isExported(statement) || !localRenderableNames.has(declaration.name.text)) {
          continue;
        }

        namedExports.add(declaration.name.text);
      }
      continue;
    }

    if (ts.isExportAssignment(statement)) {
      if (ts.isIdentifier(statement.expression) && localRenderableNames.has(statement.expression.text)) {
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

        if (!localRenderableNames.has(localName)) {
          continue;
        }

        if (exportName === "default") {
          hasDefaultComponent = true;
        } else {
          namedExports.add(exportName);
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

  return {
    filePath: options.filePath,
    relativePath: path.relative(options.sourceRoot, options.filePath).split(path.sep).join("/"),
    isTsx: options.filePath.endsWith(".tsx"),
    imports: imports.sort((left, right) => left.localeCompare(right)),
    diagnostics,
    componentExports: [...namedExports].sort((left, right) => left.localeCompare(right)),
    hasDefaultComponent,
    preview: previewExported
      ? (preview ?? { hasExport: true, hasProps: false, hasRender: false })
      : { hasExport: false, hasProps: false, hasRender: false },
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

function getRenderTarget(record: SourceModuleRecord): PreviewRenderTarget {
  if (record.preview.hasRender) {
    return { mode: "preview-render" };
  }

  if (record.hasDefaultComponent) {
    return {
      mode: "auto",
      exportName: "default",
      usesPreviewProps: record.preview.hasProps,
    };
  }

  if (record.componentExports.length === 1) {
    return {
      mode: "auto",
      exportName: record.componentExports[0],
      usesPreviewProps: record.preview.hasProps,
    };
  }

  return { mode: "none" };
}

function isPreviewPackageInternalEntry(packageRoot: string, relativePath: string) {
  const previewPackageRoot = path.resolve(__dirname, "../..");
  if (path.resolve(packageRoot) !== previewPackageRoot) {
    return false;
  }

  return PREVIEW_PACKAGE_ENTRY_EXCLUDES.some((prefix) => relativePath.startsWith(prefix));
}

function createRegistryItem(
  record: SourceModuleRecord,
  recordsByPath: Map<string, SourceModuleRecord>,
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
  const render = getRenderTarget(record);
  const status = diagnostics.length > 0 ? "error" : render.mode === "none" ? "needs-harness" : "ready";
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
    exportNames: record.hasDefaultComponent ? ["default", ...record.componentExports] : [...record.componentExports],
    hasDefaultExport: record.hasDefaultComponent,
    hasPreviewExport: record.preview.hasExport,
    diagnostics,
  };
}

export function discoverPreviewProject(options: DiscoverPreviewProjectOptions): PreviewProject {
  const packageName = options.packageName ?? path.basename(options.packageRoot);
  const sourceFiles = listSourceFiles(options.sourceRoot);
  const records = sourceFiles.map((filePath) =>
    analyzeSourceModule({
      filePath,
      packageName,
      packageRoot: options.packageRoot,
      sourceRoot: options.sourceRoot,
    }),
  );
  const recordsByPath = new Map(records.map((record) => [record.filePath, record] as const));
  const entries = records
    .filter((record) => record.isTsx)
    .filter((record) => !isPreviewPackageInternalEntry(options.packageRoot, record.relativePath))
    .map((record) => createRegistryItem(record, recordsByPath, packageName, packageName))
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
