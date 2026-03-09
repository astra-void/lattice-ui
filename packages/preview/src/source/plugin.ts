import fs from "node:fs";
import path from "node:path";
import { compile_tsx, transformPreviewSource } from "@lattice-ui/compiler";
import ts from "typescript";
import { discoverPreviewWorkspace } from "./discover";
import { createErrorWithCause } from "../errorWithCause";
import {
  createUnresolvedPackageMockResolvePlugin,
  createUnresolvedPackageMockTransformPlugin,
} from "./robloxPackageMockPlugin";
import type { PreviewSourceTarget } from "./types";
import type { PreviewDevServer, PreviewPlugin, PreviewPluginOption } from "./viteTypes";

const REGISTRY_MODULE_ID = "virtual:lattice-preview-registry";
const RESOLVED_REGISTRY_MODULE_ID = `\0${REGISTRY_MODULE_ID}`;
const RUNTIME_MODULE_ID = "virtual:lattice-preview-runtime";
const RESOLVED_RUNTIME_MODULE_ID = `\0${RUNTIME_MODULE_ID}`;
const ENTRY_MODULE_ID_PREFIX = "virtual:lattice-preview-entry:";
const RBX_STYLE_HELPER_NAME = "__rbxStyle";
const RBX_STYLE_IMPORT = `import { ${RBX_STYLE_HELPER_NAME} } from "@lattice-ui/preview/runtime";\n`;

export type CreatePreviewVitePluginOptions = {
  projectName: string;
  targets: PreviewSourceTarget[];
};

function isUnderRoot(rootPath: string, filePath: string) {
  const relativePath = path.relative(rootPath, filePath);
  return relativePath.length > 0 && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
}

function resolveRuntimeEntryPath() {
  const candidates = [
    path.resolve(__dirname, "../runtime/index.ts"),
    path.resolve(__dirname, "../../src/runtime/index.ts"),
    path.resolve(__dirname, "../runtime/index.mjs"),
    path.resolve(__dirname, "../runtime/index.js"),
  ];
  const candidate = candidates.find((filePath) => fs.existsSync(filePath));
  if (!candidate) {
    throw new Error("Unable to resolve @lattice-ui/preview runtime entry.");
  }

  return candidate.split(path.sep).join("/");
}

function resolveMockEntryPath() {
  const candidates = [
    path.resolve(__dirname, "./robloxEnv.ts"),
    path.resolve(__dirname, "../../src/source/robloxEnv.ts"),
    path.resolve(__dirname, "./robloxEnv.js"),
  ];
  const candidate = candidates.find((filePath) => fs.existsSync(filePath));
  if (!candidate) {
    throw new Error("Unable to resolve preview mock entry.");
  }

  return candidate.split(path.sep).join("/");
}

function stripQuery(id: string) {
  const [filePath] = id.split("?", 1);
  return filePath;
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

function findTargetForFilePath(filePath: string, targets: PreviewSourceTarget[]) {
  const extension = path.extname(filePath);
  if (extension !== ".ts" && extension !== ".tsx") {
    return undefined;
  }

  return targets.find((target) => isUnderRoot(target.sourceRoot, filePath));
}

function renderRegistryModule(options: CreatePreviewVitePluginOptions) {
  const workspace = discoverPreviewWorkspace(options);
  const importers = workspace.entries
    .map(
      (entry) =>
        `  ${JSON.stringify(entry.id)}: () => import(${JSON.stringify(
          `${ENTRY_MODULE_ID_PREFIX}${encodeURIComponent(entry.id)}`,
        )}),`,
    )
    .join("\n");

  return {
    code: `export const previewProjectName = ${JSON.stringify(workspace.projectName)};
export const previewEntries = ${JSON.stringify(workspace.entries, null, 2)};
export const previewImporters = {
${importers}
};
`,
    workspace,
  };
}

export function createPreviewVitePlugin(options: CreatePreviewVitePluginOptions): PreviewPluginOption {
  const runtimeEntryPath = resolveRuntimeEntryPath();
  const mockEntryPath = resolveMockEntryPath();
  let registry = renderRegistryModule(options);
  let server: PreviewDevServer | undefined;

  const refreshRegistry = (triggerReload: boolean) => {
    registry = renderRegistryModule(options);

    if (!server) {
      return;
    }

    const registryModule = server.moduleGraph.getModuleById(RESOLVED_REGISTRY_MODULE_ID);
    if (registryModule) {
      server.moduleGraph.invalidateModule(registryModule);
    }

    if (triggerReload) {
      server.ws.send({ type: "full-reload" });
    }
  };

  const previewPlugin: PreviewPlugin = {
    name: "lattice-preview-source-first",
    enforce: "pre",
    configureServer(configuredServer: PreviewDevServer) {
      server = configuredServer;
      configuredServer.watcher.on("add", (filePath: string) => {
        if (findTargetForFilePath(filePath, options.targets)) {
          refreshRegistry(true);
        }
      });
      configuredServer.watcher.on("unlink", (filePath: string) => {
        if (findTargetForFilePath(filePath, options.targets)) {
          refreshRegistry(true);
        }
      });
    },
    handleHotUpdate(context: { file: string }) {
      if (findTargetForFilePath(context.file, options.targets)) {
        refreshRegistry(true);
      }
    },
    load(id: string) {
      if (id === RESOLVED_REGISTRY_MODULE_ID) {
        return registry.code;
      }

      if (id === RESOLVED_RUNTIME_MODULE_ID) {
        return `export * from ${JSON.stringify(resolveRuntimeEntryPath())};\n`;
      }

      return undefined;
    },
    resolveId(id: string) {
      if (id === REGISTRY_MODULE_ID) {
        return RESOLVED_REGISTRY_MODULE_ID;
      }

      if (id === RUNTIME_MODULE_ID) {
        return RESOLVED_RUNTIME_MODULE_ID;
      }

      if (id.startsWith(ENTRY_MODULE_ID_PREFIX)) {
        const entryId = decodeURIComponent(id.slice(ENTRY_MODULE_ID_PREFIX.length));
        const matchedEntry = registry.workspace.entries.find((entry) => entry.id === entryId);
        return matchedEntry?.sourceFilePath;
      }

      return undefined;
    },
    transform(code: string, id: string) {
      const filePath = stripQuery(id);
      const target = findTargetForFilePath(filePath, options.targets);
      if (!target) {
        return undefined;
      }

      const transformed = transformPreviewSourceOrThrow(code, {
        filePath,
        runtimeModule: runtimeEntryPath,
        target: target.name,
      });

      let transformedCode = compile_tsx(transformed.code);
      transformedCode = stripTypeSyntax(transformedCode, filePath);

      if (transformedCode.includes(RBX_STYLE_HELPER_NAME) && !transformedCode.includes(RBX_STYLE_IMPORT.trim())) {
        transformedCode = `${RBX_STYLE_IMPORT}${transformedCode}`;
      }

      return {
        code: transformedCode,
        map: null,
      };
    },
  };

  return [
    createUnresolvedPackageMockResolvePlugin(mockEntryPath),
    previewPlugin,
    createUnresolvedPackageMockTransformPlugin(),
  ];
}
