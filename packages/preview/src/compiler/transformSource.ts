import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import type { TransformPreviewSourceOptions, TransformPreviewSourceResult, UnsupportedPatternError } from "./types";

const previewGlobalHelperName = "__previewGlobal";
const runtimeHelperNames = [
  previewGlobalHelperName,
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
  "UIScale",
  "UIGradient",
  "UIPageLayout",
  "UITableLayout",
  "UISizeConstraint",
  "UITextSizeConstraint",
  "UIAspectRatioConstraint",
  "UIFlexItem",
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
  uiscale: "UIScale",
  uigradient: "UIGradient",
  uipagelayout: "UIPageLayout",
  uitablelayout: "UITableLayout",
  uisizeconstraint: "UISizeConstraint",
  uitextsizeconstraint: "UITextSizeConstraint",
  uiaspectratioconstraint: "UIAspectRatioConstraint",
  uiflexitem: "UIFlexItem",
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
const runtimeBindingNames = new Set<string>([previewGlobalHelperName, ...runtimeHelperNames, ...runtimeHostNames]);
const neverRewriteIdentifierNames = new Set([previewGlobalHelperName, "arguments", "require"]);

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

function createPreviewGlobalAccessExpression(name: string) {
  return ts.factory.createCallExpression(ts.factory.createIdentifier(previewGlobalHelperName), undefined, [
    ts.factory.createStringLiteral(name),
  ]);
}

function addBindingNames(bindings: Set<string>, name: ts.BindingName) {
  if (ts.isIdentifier(name)) {
    bindings.add(name.text);
    return;
  }

  for (const element of name.elements) {
    if (ts.isOmittedExpression(element)) {
      continue;
    }

    addBindingNames(bindings, element.name);
  }
}

function addImportBindings(bindings: Set<string>, importClause: ts.ImportClause) {
  if (importClause.name) {
    bindings.add(importClause.name.text);
  }

  const namedBindings = importClause.namedBindings;
  if (!namedBindings) {
    return;
  }

  if (ts.isNamespaceImport(namedBindings)) {
    bindings.add(namedBindings.name.text);
    return;
  }

  for (const element of namedBindings.elements) {
    bindings.add(element.name.text);
  }
}

function addStatementBindings(bindings: Set<string>, statement: ts.Statement) {
  if (ts.isVariableStatement(statement)) {
    for (const declaration of statement.declarationList.declarations) {
      addBindingNames(bindings, declaration.name);
    }
    return;
  }

  if (ts.isFunctionDeclaration(statement) && statement.name) {
    bindings.add(statement.name.text);
    return;
  }

  if (ts.isClassDeclaration(statement) && statement.name) {
    bindings.add(statement.name.text);
    return;
  }

  if (ts.isEnumDeclaration(statement)) {
    bindings.add(statement.name.text);
    return;
  }

  if (ts.isImportDeclaration(statement) && statement.importClause) {
    addImportBindings(bindings, statement.importClause);
    return;
  }

  if (ts.isImportEqualsDeclaration(statement)) {
    bindings.add(statement.name.text);
    return;
  }

  if (ts.isForStatement(statement) && statement.initializer && ts.isVariableDeclarationList(statement.initializer)) {
    for (const declaration of statement.initializer.declarations) {
      addBindingNames(bindings, declaration.name);
    }
    return;
  }

  if (ts.isForInStatement(statement) && ts.isVariableDeclarationList(statement.initializer)) {
    for (const declaration of statement.initializer.declarations) {
      addBindingNames(bindings, declaration.name);
    }
    return;
  }

  if (ts.isForOfStatement(statement) && ts.isVariableDeclarationList(statement.initializer)) {
    for (const declaration of statement.initializer.declarations) {
      addBindingNames(bindings, declaration.name);
    }
  }
}

function createsLexicalScope(node: ts.Node) {
  return (
    ts.isSourceFile(node) ||
    ts.isBlock(node) ||
    ts.isModuleBlock(node) ||
    ts.isCaseClause(node) ||
    ts.isDefaultClause(node) ||
    ts.isCatchClause(node) ||
    ts.isForStatement(node) ||
    ts.isForInStatement(node) ||
    ts.isForOfStatement(node) ||
    ts.isFunctionLike(node)
  );
}

function collectScopeBindings(node: ts.Node) {
  const bindings = new Set<string>();

  if (ts.isSourceFile(node) || ts.isBlock(node) || ts.isModuleBlock(node)) {
    for (const statement of node.statements) {
      addStatementBindings(bindings, statement);
    }
    return bindings;
  }

  if (ts.isCaseClause(node) || ts.isDefaultClause(node)) {
    for (const statement of node.statements) {
      addStatementBindings(bindings, statement);
    }
    return bindings;
  }

  if (ts.isCatchClause(node)) {
    if (node.variableDeclaration) {
      addBindingNames(bindings, node.variableDeclaration.name);
    }
    return bindings;
  }

  if (ts.isForStatement(node) && node.initializer && ts.isVariableDeclarationList(node.initializer)) {
    for (const declaration of node.initializer.declarations) {
      addBindingNames(bindings, declaration.name);
    }
    return bindings;
  }

  if (ts.isForInStatement(node) && ts.isVariableDeclarationList(node.initializer)) {
    for (const declaration of node.initializer.declarations) {
      addBindingNames(bindings, declaration.name);
    }
    return bindings;
  }

  if (ts.isForOfStatement(node) && ts.isVariableDeclarationList(node.initializer)) {
    for (const declaration of node.initializer.declarations) {
      addBindingNames(bindings, declaration.name);
    }
    return bindings;
  }

  if (ts.isFunctionLike(node)) {
    if ((ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) && node.name) {
      bindings.add(node.name.text);
    }

    for (const parameter of node.parameters) {
      addBindingNames(bindings, parameter.name);
    }
  }

  return bindings;
}

function hasBinding(scopeStack: ReadonlyArray<ReadonlySet<string>>, name: string) {
  for (let index = scopeStack.length - 1; index >= 0; index -= 1) {
    if (scopeStack[index]?.has(name)) {
      return true;
    }
  }

  return false;
}

function isIdentifierWriteTarget(node: ts.Identifier) {
  const parent = node.parent;
  if (!parent) {
    return false;
  }

  if (
    ts.isBinaryExpression(parent) &&
    parent.left === node &&
    parent.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
    parent.operatorToken.kind <= ts.SyntaxKind.LastAssignment
  ) {
    return true;
  }

  if (
    (ts.isPrefixUnaryExpression(parent) || ts.isPostfixUnaryExpression(parent)) &&
    parent.operand === node &&
    (parent.operator === ts.SyntaxKind.PlusPlusToken || parent.operator === ts.SyntaxKind.MinusMinusToken)
  ) {
    return true;
  }

  return false;
}

function isTypeOnlyIdentifier(node: ts.Identifier) {
  const parent = node.parent;
  if (!parent) {
    return false;
  }

  if (ts.isTypeNode(parent) && !ts.isExpressionWithTypeArguments(parent)) {
    return true;
  }

  if (ts.isQualifiedName(parent) || ts.isImportTypeNode(parent) || ts.isTypeQueryNode(parent)) {
    return true;
  }

  if (
    ts.isExpressionWithTypeArguments(parent) &&
    ts.isHeritageClause(parent.parent) &&
    parent.parent.token === ts.SyntaxKind.ImplementsKeyword
  ) {
    return true;
  }

  return false;
}

function shouldRewriteIdentifier(node: ts.Identifier, scopeStack: ReadonlyArray<ReadonlySet<string>>) {
  if (neverRewriteIdentifierNames.has(node.text) || hasBinding(scopeStack, node.text)) {
    return false;
  }

  if (isTypeOnlyIdentifier(node) || isIdentifierWriteTarget(node)) {
    return false;
  }

  const parent = node.parent;
  if (!parent) {
    return false;
  }

  if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
    return false;
  }

  if (ts.isPropertyAssignment(parent) && parent.name === node) {
    return false;
  }

  if (ts.isShorthandPropertyAssignment(parent)) {
    return false;
  }

  if (ts.isImportClause(parent) || ts.isImportSpecifier(parent) || ts.isNamespaceImport(parent)) {
    return false;
  }

  if (ts.isNamespaceExport(parent) || ts.isImportEqualsDeclaration(parent) || ts.isExportSpecifier(parent)) {
    return false;
  }

  if (ts.isVariableDeclaration(parent) && parent.name === node) {
    return false;
  }

  if (ts.isParameter(parent) && parent.name === node) {
    return false;
  }

  if (ts.isBindingElement(parent) && (parent.name === node || parent.propertyName === node)) {
    return false;
  }

  if (
    (ts.isFunctionDeclaration(parent) ||
      ts.isFunctionExpression(parent) ||
      ts.isClassDeclaration(parent) ||
      ts.isClassExpression(parent)) &&
    parent.name === node
  ) {
    return false;
  }

  if ((ts.isInterfaceDeclaration(parent) || ts.isTypeAliasDeclaration(parent) || ts.isEnumDeclaration(parent)) && parent.name === node) {
    return false;
  }

  if (ts.isEnumMember(parent) && parent.name === node) {
    return false;
  }

  if (ts.isModuleDeclaration(parent) && parent.name === node) {
    return false;
  }

  if (ts.isTypeParameterDeclaration(parent) && parent.name === node) {
    return false;
  }

  if (ts.isLabeledStatement(parent) && parent.label === node) {
    return false;
  }

  if (ts.isBreakStatement(parent) && parent.label === node) {
    return false;
  }

  if (ts.isContinueStatement(parent) && parent.label === node) {
    return false;
  }

  if (ts.isPropertyDeclaration(parent) && parent.name === node) {
    return false;
  }

  if (ts.isPropertySignature(parent) && parent.name === node) {
    return false;
  }

  if (ts.isMethodDeclaration(parent) && parent.name === node) {
    return false;
  }

  if (ts.isMethodSignature(parent) && parent.name === node) {
    return false;
  }

  if (ts.isGetAccessorDeclaration(parent) && parent.name === node) {
    return false;
  }

  if (ts.isSetAccessorDeclaration(parent) && parent.name === node) {
    return false;
  }

  if (ts.isJsxOpeningElement(parent) && parent.tagName === node) {
    return false;
  }

  if (ts.isJsxClosingElement(parent) && parent.tagName === node) {
    return false;
  }

  if (ts.isJsxSelfClosingElement(parent) && parent.tagName === node) {
    return false;
  }

  if (ts.isJsxAttribute(parent) && parent.name === node) {
    return false;
  }

  if (ts.isMetaProperty(parent)) {
    return false;
  }

  return true;
}

export function transformPreviewSource(
  sourceText: string,
  options: TransformPreviewSourceOptions,
): TransformPreviewSourceResult {
  const scriptKind = options.filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(options.filePath, sourceText, ts.ScriptTarget.Latest, true, scriptKind);
  const errors: UnsupportedPatternError[] = [];

  const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    const visitNode = (node: ts.Node, scopeStack: ReadonlyArray<ReadonlySet<string>>): ts.Node => {
      const nextScopeStack = createsLexicalScope(node) ? [...scopeStack, collectScopeBindings(node)] : scopeStack;
      const visitChild: ts.Visitor = (child) => visitNode(child, nextScopeStack);

      if (ts.isShorthandPropertyAssignment(node) && shouldRewriteIdentifier(node.name, nextScopeStack)) {
        return ts.factory.createPropertyAssignment(
          ts.factory.createIdentifier(node.name.text),
          createPreviewGlobalAccessExpression(node.name.text),
        );
      }

      if (ts.isPropertyAccessExpression(node) && node.getText(sourceFile).startsWith("Enum.")) {
        const resolvedEnum = resolveEnumLiteral(node, sourceFile);
        if (resolvedEnum) {
          return resolvedEnum;
        }

        return ts.visitEachChild(node, visitChild, context);
      }

      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === "IsA"
      ) {
        const [argument] = node.arguments;
        if (argument && ts.isStringLiteral(argument) && supportedIsATypeNames.has(argument.text)) {
          return ts.factory.createCallExpression(ts.factory.createIdentifier("isPreviewElement"), undefined, [
            ts.visitNode(node.expression.expression, visitChild) as ts.Expression,
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
            node.typeArguments.map((typeArgument) => ts.visitNode(typeArgument, visitChild) as ts.TypeNode),
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
        return rewriteTypeReference(node, visitChild);
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
                `Host element ${hostName} is not supported by preview generation.`,
                hostName,
              ),
            );
          } else {
            return ts.factory.updateJsxSelfClosingElement(
              node,
              ts.factory.createIdentifier(mapped),
              node.typeArguments,
              ts.visitNode(node.attributes, visitChild) as ts.JsxAttributes,
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
                `Host element ${hostName} is not supported by preview generation.`,
                hostName,
              ),
            );
          } else {
            return ts.factory.updateJsxOpeningElement(
              node,
              ts.factory.createIdentifier(mapped),
              node.typeArguments,
              ts.visitNode(node.attributes, visitChild) as ts.JsxAttributes,
            );
          }
        }
      }

      if (ts.isJsxClosingElement(node)) {
        const hostName = getLowerCaseJsxText(node.tagName);
        if (!hostName) {
          return ts.visitEachChild(node, visitChild, context);
        }

        const mapped = supportedHostMap[hostName as keyof typeof supportedHostMap];
        if (!mapped) {
          errors.push(
            createUnsupportedError(
              sourceFile,
              options,
              node.tagName,
              "UNSUPPORTED_HOST_ELEMENT",
              `Host element ${hostName} is not supported by preview generation.`,
              hostName,
            ),
          );
        } else {
          return ts.factory.updateJsxClosingElement(node, ts.factory.createIdentifier(mapped));
        }
      }

      if (ts.isIdentifier(node) && shouldRewriteIdentifier(node, nextScopeStack)) {
        return createPreviewGlobalAccessExpression(node.text);
      }

      return ts.visitEachChild(node, visitChild, context);
    };

    return (node) => visitNode(node, [runtimeBindingNames]) as ts.SourceFile;
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


