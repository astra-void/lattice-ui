import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import type { TransformPreviewSourceOptions, TransformPreviewSourceResult, UnsupportedPatternError } from "./types";

const runtimeHelperNames = [
  "Color3",
  "UDim2",
  "UDim",
  "Vector2",
  "typeIs",
  "pairs",
  "error",
  "isPreviewElement",
] as const;
const runtimeHostNames = [
  "Frame",
  "TextButton",
  "ScreenGui",
  "TextLabel",
  "TextBox",
  "ImageLabel",
  "ScrollingFrame",
  "UICorner",
  "UIPadding",
  "UIListLayout",
  "UIGridLayout",
  "UIStroke",
] as const;
const supportedHostMap = {
  frame: "Frame",
  textbutton: "TextButton",
  screengui: "ScreenGui",
  textlabel: "TextLabel",
  textbox: "TextBox",
  imagelabel: "ImageLabel",
  scrollingframe: "ScrollingFrame",
  uicorner: "UICorner",
  uipadding: "UIPadding",
  uilistlayout: "UIListLayout",
  uigridlayout: "UIGridLayout",
  uistroke: "UIStroke",
} as const;
const supportedTypeNames = new Set([
  "GuiObject",
  "BasePlayerGui",
  "Instance",
  "Frame",
  "ScreenGui",
  "TextButton",
  "TextLabel",
  "TextBox",
  "ImageLabel",
  "ScrollingFrame",
]);
const supportedIsATypeNames = new Set([
  "GuiObject",
  "Frame",
  "ScreenGui",
  "TextButton",
  "TextLabel",
  "TextBox",
  "ImageLabel",
  "ScrollingFrame",
]);
const supportedEnumValues = new Map<string, string>([
  ["Enum.TextXAlignment.Left", "left"],
  ["Enum.TextXAlignment.Center", "center"],
  ["Enum.TextXAlignment.Right", "right"],
  ["Enum.TextYAlignment.Top", "top"],
  ["Enum.TextYAlignment.Center", "center"],
  ["Enum.TextYAlignment.Bottom", "bottom"],
  ["Enum.FillDirection.Horizontal", "horizontal"],
  ["Enum.FillDirection.Vertical", "vertical"],
  ["Enum.SortOrder.LayoutOrder", "layout-order"],
  ["Enum.SortOrder.Name", "name"],
  ["Enum.AutomaticSize.None", "none"],
  ["Enum.AutomaticSize.X", "x"],
  ["Enum.AutomaticSize.Y", "y"],
  ["Enum.AutomaticSize.XY", "xy"],
  ["Enum.ScrollingDirection.X", "x"],
  ["Enum.ScrollingDirection.Y", "y"],
  ["Enum.ScrollingDirection.XY", "xy"],
  ["Enum.KeyCode.Return", "Enter"],
  ["Enum.KeyCode.Space", " "],
  ["Enum.KeyCode.Down", "ArrowDown"],
  ["Enum.KeyCode.Up", "ArrowUp"],
  ["Enum.KeyCode.Left", "ArrowLeft"],
  ["Enum.KeyCode.Right", "ArrowRight"],
  ["Enum.KeyCode.Home", "Home"],
  ["Enum.KeyCode.End", "End"],
  ["Enum.KeyCode.PageUp", "PageUp"],
  ["Enum.KeyCode.PageDown", "PageDown"],
  ["Enum.KeyCode.Escape", "Escape"],
  ["Enum.KeyCode.Backspace", "Backspace"],
]);

function getLineAndColumn(sourceFile: ts.SourceFile, start: number) {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(start);
  return {
    line: line + 1,
    column: character + 1,
  };
}

function createUnsupportedError(
  sourceFile: ts.SourceFile,
  options: TransformPreviewSourceOptions,
  node: ts.Node,
  code: UnsupportedPatternError["code"],
  message: string,
  symbol?: string,
): UnsupportedPatternError {
  const { line, column } = getLineAndColumn(sourceFile, node.getStart(sourceFile));
  return {
    code,
    message,
    file: options.filePath,
    line,
    column,
    symbol,
    target: options.target,
  };
}

function getLowerCaseJsxText(node: ts.JsxTagNameExpression) {
  if (!ts.isIdentifier(node) || node.text.toLowerCase() !== node.text) {
    return undefined;
  }

  return node.text;
}

function createNamedImportDeclaration(runtimeModule: string, specifiers: readonly ts.ImportSpecifier[]) {
  return ts.factory.createImportDeclaration(
    undefined,
    ts.factory.createImportClause(undefined, undefined, ts.factory.createNamedImports(specifiers)),
    ts.factory.createStringLiteral(runtimeModule),
    undefined,
  );
}

function createRuntimeImportSpecifiers() {
  return [...runtimeHelperNames, ...runtimeHostNames].map((name) =>
    ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(name)),
  );
}

function cloneImportSpecifier(specifier: ts.ImportSpecifier, forceTypeOnly = false) {
  return ts.factory.createImportSpecifier(
    forceTypeOnly || specifier.isTypeOnly,
    specifier.propertyName ? ts.factory.createIdentifier(specifier.propertyName.text) : undefined,
    ts.factory.createIdentifier(specifier.name.text),
  );
}

function collectMergedRuntimeSpecifiers(
  importClause: ts.ImportClause,
  specifiersByLocalName: Map<string, ts.ImportSpecifier>,
) {
  if (!importClause.namedBindings || !ts.isNamedImports(importClause.namedBindings)) {
    return;
  }

  for (const specifier of importClause.namedBindings.elements) {
    const nextSpecifier = cloneImportSpecifier(specifier, importClause.isTypeOnly);
    const localName = nextSpecifier.name.text;
    const existingSpecifier = specifiersByLocalName.get(localName);

    if (!existingSpecifier || (existingSpecifier.isTypeOnly && !nextSpecifier.isTypeOnly)) {
      specifiersByLocalName.set(localName, nextSpecifier);
    }
  }
}

function mergeRuntimeImports(statements: readonly ts.Statement[], runtimeModule: string) {
  const specifiersByLocalName = new Map<string, ts.ImportSpecifier>();
  const remainingStatements: ts.Statement[] = [];

  for (const helperImportSpecifier of createRuntimeImportSpecifiers()) {
    specifiersByLocalName.set(helperImportSpecifier.name.text, helperImportSpecifier);
  }

  for (const statement of statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== runtimeModule ||
      !statement.importClause
    ) {
      remainingStatements.push(statement);
      continue;
    }

    if (
      statement.importClause.name ||
      (statement.importClause.namedBindings && ts.isNamespaceImport(statement.importClause.namedBindings))
    ) {
      remainingStatements.push(statement);
      continue;
    }

    collectMergedRuntimeSpecifiers(statement.importClause, specifiersByLocalName);
  }

  return [createNamedImportDeclaration(runtimeModule, [...specifiersByLocalName.values()]), ...remainingStatements];
}

function createPreviewElementType() {
  return ts.factory.createUnionTypeNode([
    ts.factory.createTypeReferenceNode("HTMLElement"),
    ts.factory.createLiteralTypeNode(ts.factory.createNull()),
  ]);
}

function rewriteTypeReference(node: ts.TypeReferenceNode, visit: ts.Visitor): ts.TypeNode {
  if (!ts.isIdentifier(node.typeName)) {
    return ts.factory.updateTypeReferenceNode(
      node,
      node.typeName,
      node.typeArguments
        ? ts.factory.createNodeArray(
            node.typeArguments.map((typeArgument) => ts.visitNode(typeArgument, visit) as ts.TypeNode),
          )
        : undefined,
    );
  }

  if (supportedTypeNames.has(node.typeName.text)) {
    return createPreviewElementType();
  }

  if (node.typeName.text === "InputObject") {
    return ts.factory.createTypeReferenceNode("Event");
  }

  return ts.factory.updateTypeReferenceNode(
    node,
    node.typeName,
    node.typeArguments
      ? ts.factory.createNodeArray(
          node.typeArguments.map((typeArgument) => ts.visitNode(typeArgument, visit) as ts.TypeNode),
        )
      : undefined,
  );
}

function resolveEnumLiteral(node: ts.PropertyAccessExpression, sourceFile: ts.SourceFile) {
  const text = node.getText(sourceFile);
  const resolved = supportedEnumValues.get(text);
  return resolved === undefined ? undefined : ts.factory.createStringLiteral(resolved);
}

function resolveRelativeModuleSpecifier(filePath: string, moduleSpecifier: string) {
  if (!moduleSpecifier.startsWith(".") || path.extname(moduleSpecifier).length > 0) {
    return moduleSpecifier;
  }

  const currentDir = path.dirname(filePath);
  const resolvedBase = path.resolve(currentDir, moduleSpecifier);
  const candidates = [
    `${resolvedBase}.ts`,
    `${resolvedBase}.tsx`,
    path.join(resolvedBase, "index.ts"),
    path.join(resolvedBase, "index.tsx"),
  ];
  const resolvedPath = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());

  if (!resolvedPath) {
    return moduleSpecifier;
  }

  const relativePath = path.relative(currentDir, resolvedPath).split(path.sep).join("/");
  return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
}

export function transformPreviewSource(
  sourceText: string,
  options: TransformPreviewSourceOptions,
): TransformPreviewSourceResult {
  const scriptKind = options.filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(options.filePath, sourceText, ts.ScriptTarget.Latest, true, scriptKind);
  const errors: UnsupportedPatternError[] = [];

  const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    const visit: ts.Visitor = (node) => {
      if (ts.isIdentifier(node) && node.text === "game") {
        const parent = node.parent;
        const isPropertyName = ts.isPropertyAccessExpression(parent) && parent.name === node;
        const isImport = ts.isImportSpecifier(parent) || ts.isImportClause(parent);
        if (!isPropertyName && !isImport) {
          errors.push(
            createUnsupportedError(
              sourceFile,
              options,
              node,
              "UNSUPPORTED_GLOBAL",
              "The Roblox `game` global is not supported by preview generation.",
              "game",
            ),
          );
        }
      }

      if (ts.isPropertyAccessExpression(node) && node.getText(sourceFile).startsWith("Enum.")) {
        const resolvedEnum = resolveEnumLiteral(node, sourceFile);
        if (resolvedEnum) {
          return resolvedEnum;
        }

        const isNestedEnum =
          ts.isPropertyAccessExpression(node.parent) &&
          node.parent.expression === node &&
          node.parent.getText(sourceFile).startsWith("Enum.");
        if (isNestedEnum) {
          return ts.visitEachChild(node, visit, context);
        }

        errors.push(
          createUnsupportedError(
            sourceFile,
            options,
            node,
            "UNSUPPORTED_ENUM",
            "Roblox `Enum` access is not supported by preview generation.",
            node.getText(sourceFile),
          ),
        );
      }

      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === "IsA"
      ) {
        const [argument] = node.arguments;
        if (argument && ts.isStringLiteral(argument) && supportedIsATypeNames.has(argument.text)) {
          return ts.factory.createCallExpression(ts.factory.createIdentifier("isPreviewElement"), undefined, [
            ts.visitNode(node.expression.expression, visit) as ts.Expression,
            ts.factory.createStringLiteral(argument.text),
          ]);
        }

        errors.push(
          createUnsupportedError(
            sourceFile,
            options,
            node,
            "UNSUPPORTED_RUNTIME_PATTERN",
            "Only preview-supported `IsA(...)` checks can be mapped for preview generation.",
            node.getText(sourceFile),
          ),
        );
      }

      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === "useRef" &&
        node.arguments.length === 0 &&
        node.typeArguments?.length === 1
      ) {
        return ts.factory.updateCallExpression(
          node,
          node.expression,
          ts.factory.createNodeArray(
            node.typeArguments.map((typeArgument) => ts.visitNode(typeArgument, visit) as ts.TypeNode),
          ),
          [ts.factory.createNull()],
        );
      }

      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const moduleName = node.moduleSpecifier.text;
        if (
          moduleName === "@lattice-ui/core" ||
          moduleName === "@lattice-ui/layer" ||
          moduleName === "@lattice-ui/focus" ||
          moduleName === "@lattice-ui/style"
        ) {
          return ts.factory.updateImportDeclaration(
            node,
            node.modifiers,
            node.importClause,
            ts.factory.createStringLiteral(options.runtimeModule),
            node.attributes,
          );
        }

        if (moduleName === "@rbxts/react") {
          return ts.factory.updateImportDeclaration(
            node,
            node.modifiers,
            node.importClause,
            ts.factory.createStringLiteral("react"),
            node.attributes,
          );
        }

        if (moduleName.startsWith(".")) {
          return ts.factory.updateImportDeclaration(
            node,
            node.modifiers,
            node.importClause,
            ts.factory.createStringLiteral(resolveRelativeModuleSpecifier(options.filePath, moduleName)),
            node.attributes,
          );
        }
      }

      if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const moduleName = node.moduleSpecifier.text;
        if (moduleName.startsWith(".")) {
          return ts.factory.updateExportDeclaration(
            node,
            node.modifiers,
            node.isTypeOnly,
            node.exportClause,
            ts.factory.createStringLiteral(resolveRelativeModuleSpecifier(options.filePath, moduleName)),
            node.attributes,
          );
        }
      }

      if (ts.isTypeReferenceNode(node)) {
        return rewriteTypeReference(node, visit);
      }

      if (ts.isJsxSelfClosingElement(node)) {
        const hostName = getLowerCaseJsxText(node.tagName);
        if (hostName) {
          const mapped = supportedHostMap[hostName as keyof typeof supportedHostMap];
          if (!mapped) {
            errors.push(
              createUnsupportedError(
                sourceFile,
                options,
                node.tagName,
                "UNSUPPORTED_HOST_ELEMENT",
                `Host element \`${hostName}\` is not supported by preview generation.`,
                hostName,
              ),
            );
          } else {
            return ts.factory.updateJsxSelfClosingElement(
              node,
              ts.factory.createIdentifier(mapped),
              node.typeArguments,
              ts.visitNode(node.attributes, visit) as ts.JsxAttributes,
            );
          }
        }
      }

      if (ts.isJsxOpeningElement(node)) {
        const hostName = getLowerCaseJsxText(node.tagName);
        if (hostName) {
          const mapped = supportedHostMap[hostName as keyof typeof supportedHostMap];
          if (!mapped) {
            errors.push(
              createUnsupportedError(
                sourceFile,
                options,
                node.tagName,
                "UNSUPPORTED_HOST_ELEMENT",
                `Host element \`${hostName}\` is not supported by preview generation.`,
                hostName,
              ),
            );
          } else {
            return ts.factory.updateJsxOpeningElement(
              node,
              ts.factory.createIdentifier(mapped),
              node.typeArguments,
              ts.visitNode(node.attributes, visit) as ts.JsxAttributes,
            );
          }
        }
      }

      if (ts.isJsxClosingElement(node)) {
        const hostName = getLowerCaseJsxText(node.tagName);
        if (!hostName) {
          return ts.visitEachChild(node, visit, context);
        }

        const mapped = supportedHostMap[hostName as keyof typeof supportedHostMap];
        if (!mapped) {
          errors.push(
            createUnsupportedError(
              sourceFile,
              options,
              node.tagName,
              "UNSUPPORTED_HOST_ELEMENT",
              `Host element \`${hostName}\` is not supported by preview generation.`,
              hostName,
            ),
          );
        } else {
          return ts.factory.updateJsxClosingElement(node, ts.factory.createIdentifier(mapped));
        }
      }

      return ts.visitEachChild(node, visit, context);
    };

    return (node) => ts.visitNode(node, visit) as ts.SourceFile;
  };

  const transformed = ts.transform(sourceFile, [transformer]).transformed[0];
  const updatedFile = ts.factory.updateSourceFile(
    transformed,
    mergeRuntimeImports(transformed.statements, options.runtimeModule),
  );
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
  });

  return {
    code: `// Generated by @lattice-ui/preview. Do not edit.\n${printer.printFile(updatedFile)}\n`,
    errors,
  };
}
