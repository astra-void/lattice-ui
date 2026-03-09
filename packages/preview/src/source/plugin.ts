import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { compile_tsx, transformPreviewSource } from "@lattice-ui/compiler";
import {
  createPreviewEngine,
  PREVIEW_ENGINE_PROTOCOL_VERSION,
  type PreviewExecutionMode,
  type PreviewSelectionMode,
  type PreviewSourceTarget,
} from "@lattice-ui/preview-engine";
import { stripFileIdDecorations } from "./pathUtils";
import {
  createUnresolvedPackageMockResolvePlugin,
  createUnresolvedPackageMockTransformPlugin,
} from "./robloxPackageMockPlugin";
import type { PreviewDevServer, PreviewPlugin, PreviewPluginOption } from "./viteTypes";

const WORKSPACE_INDEX_MODULE_ID = "virtual:lattice-preview-workspace-index";
const RESOLVED_WORKSPACE_INDEX_MODULE_ID = `\0${WORKSPACE_INDEX_MODULE_ID}`;
const RUNTIME_MODULE_ID = "virtual:lattice-preview-runtime";
const RESOLVED_RUNTIME_MODULE_ID = `\0${RUNTIME_MODULE_ID}`;
const ENTRY_MODULE_ID_PREFIX = "virtual:lattice-preview-entry:";
const RESOLVED_ENTRY_MODULE_ID_PREFIX = `\0${ENTRY_MODULE_ID_PREFIX}`;
const RBX_STYLE_HELPER_NAME = "__rbxStyle";
const RBX_STYLE_IMPORT = `import { ${RBX_STYLE_HELPER_NAME} } from "@lattice-ui/preview-runtime";\n`;

export type CreatePreviewVitePluginOptions = {
  projectName: string;
  selectionMode?: PreviewSelectionMode;
  targets: PreviewSourceTarget[];
  transformMode?: PreviewExecutionMode;
};

function resolveRuntimeEntryPath() {
  const candidates = [
    path.resolve(__dirname, "../../../preview-runtime/src/index.ts"),
    path.resolve(__dirname, "../../../preview-runtime/dist/index.js"),
  ];
  const candidate = candidates.find((filePath) => fs.existsSync(filePath));
  if (!candidate) {
    throw new Error("Unable to resolve @lattice-ui/preview-runtime entry.");
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
    throw new Error(`Failed to parse preview source ${options.filePath}: ${detail}`);
  }
}

function getWorkspaceModuleCode(previewEngine: ReturnType<typeof createPreviewEngine>) {
  const workspaceIndex = previewEngine.getWorkspaceIndex();
  const importers = workspaceIndex.entries
    .map(
      (entry) =>
        `  ${JSON.stringify(entry.id)}: () => import(${JSON.stringify(
          `${ENTRY_MODULE_ID_PREFIX}${encodeURIComponent(entry.id)}`,
        )}),`,
    )
    .join("\n");

  return `export const previewProtocolVersion = ${JSON.stringify(PREVIEW_ENGINE_PROTOCOL_VERSION)};
export const previewWorkspaceIndex = ${JSON.stringify(workspaceIndex, null, 2)};
export const previewImporters = {
${importers}
};
`;
}

function renderEntryModule(previewEngine: ReturnType<typeof createPreviewEngine>, entryId: string) {
  const entry = previewEngine.getWorkspaceIndex().entries.find((candidate) => candidate.id === entryId);
  if (!entry) {
    throw new Error(`No preview entry registered for \`${entryId}\`.`);
  }

  const payload = previewEngine.getEntryPayload(entryId);
  if (payload.descriptor.status !== "ready") {
    return `export const __previewEntryPayload = ${JSON.stringify(payload, null, 2)};
const __previewBlockedModule = {};
export default __previewBlockedModule;
`;
  }

  const sourceFilePath = entry.sourceFilePath.split(path.sep).join("/");

  return `import * as __previewModule from ${JSON.stringify(sourceFilePath)};
export * from ${JSON.stringify(sourceFilePath)};
const __previewDefault = __previewModule.default;
export default __previewDefault;
export const __previewEntryPayload = ${JSON.stringify(payload, null, 2)};
`;
}

function isWatchedCandidate(targets: PreviewSourceTarget[], previewEngine: ReturnType<typeof createPreviewEngine>, filePath: string) {
  const normalizedFilePath = stripFileIdDecorations(filePath);
  const extension = path.extname(normalizedFilePath).toLowerCase();
  if (extension !== ".ts" && extension !== ".tsx") {
    return false;
  }

  if (previewEngine.getTargetForFilePath(normalizedFilePath)) {
    return true;
  }

  return targets.some((target) => normalizedFilePath.startsWith(target.sourceRoot));
}

export function createPreviewVitePlugin(options: CreatePreviewVitePluginOptions): PreviewPluginOption {
  const runtimeEntryPath = resolveRuntimeEntryPath();
  const mockEntryPath = resolveMockEntryPath();
  const previewEngine = createPreviewEngine({
    projectName: options.projectName,
    runtimeModule: runtimeEntryPath,
    selectionMode: options.selectionMode ?? "compat",
    targets: options.targets,
    transformMode: options.transformMode ?? "compatibility",
  });
  let server: PreviewDevServer | undefined;

  const invalidateVirtualModules = (entryIds: string[]) => {
    if (!server) {
      return;
    }

    const workspaceModule = server.moduleGraph.getModuleById(RESOLVED_WORKSPACE_INDEX_MODULE_ID);
    if (workspaceModule) {
      server.moduleGraph.invalidateModule(workspaceModule);
    }

    for (const entryId of entryIds) {
      const entryModule = server.moduleGraph.getModuleById(
        `${RESOLVED_ENTRY_MODULE_ID_PREFIX}${encodeURIComponent(entryId)}`,
      );
      if (entryModule) {
        server.moduleGraph.invalidateModule(entryModule);
      }
    }
  };

  const refreshPreviewEngine = (filePath: string) => {
    const update = previewEngine.invalidateFiles([filePath]);
    invalidateVirtualModules(update.changedEntryIds);

    if (server) {
      if (update.requiresFullReload) {
        server.ws.send({ type: "full-reload" });
      } else {
        server.ws.send({
          data: update,
          event: "lattice-preview:update",
          type: "custom",
        });
      }
    }

    return update;
  };

  const previewPlugin: PreviewPlugin = {
    name: "lattice-preview-source-first",
    enforce: "pre",
    configureServer(configuredServer: PreviewDevServer) {
      server = configuredServer;
      configuredServer.watcher.on("add", (filePath: string) => {
        if (isWatchedCandidate(options.targets, previewEngine, filePath)) {
          refreshPreviewEngine(filePath);
        }
      });
      configuredServer.watcher.on("unlink", (filePath: string) => {
        if (isWatchedCandidate(options.targets, previewEngine, filePath)) {
          refreshPreviewEngine(filePath);
        }
      });
    },
    handleHotUpdate(context: { file: string }) {
      if (!isWatchedCandidate(options.targets, previewEngine, context.file)) {
        return undefined;
      }

      refreshPreviewEngine(context.file);
      return [];
    },
    load(id: string) {
      if (id === RESOLVED_WORKSPACE_INDEX_MODULE_ID) {
        return getWorkspaceModuleCode(previewEngine);
      }

      if (id === RESOLVED_RUNTIME_MODULE_ID) {
        return `export * from ${JSON.stringify(resolveRuntimeEntryPath())};\n`;
      }

      if (id.startsWith(RESOLVED_ENTRY_MODULE_ID_PREFIX)) {
        const entryId = decodeURIComponent(id.slice(RESOLVED_ENTRY_MODULE_ID_PREFIX.length));
        return renderEntryModule(previewEngine, entryId);
      }

      return undefined;
    },
    resolveId(id: string) {
      if (id === WORKSPACE_INDEX_MODULE_ID) {
        return RESOLVED_WORKSPACE_INDEX_MODULE_ID;
      }

      if (id === RUNTIME_MODULE_ID) {
        return RESOLVED_RUNTIME_MODULE_ID;
      }

      if (id.startsWith(ENTRY_MODULE_ID_PREFIX)) {
        return `${RESOLVED_ENTRY_MODULE_ID_PREFIX}${id.slice(ENTRY_MODULE_ID_PREFIX.length)}`;
      }

      return undefined;
    },
    transform(code: string, id: string) {
      const filePath = stripFileIdDecorations(id);
      const target = previewEngine.getTargetForFilePath(filePath);
      if (!target) {
        return undefined;
      }

      const transformed = transformPreviewSourceOrThrow(code, {
        filePath,
        mode: options.transformMode ?? "compatibility",
        runtimeModule: runtimeEntryPath,
        target: target.name,
      });
      if (transformed.code === null) {
        const diagnosticMessage =
          transformed.diagnostics.map((diagnostic) => `${diagnostic.code}: ${diagnostic.summary}`).join("\n") ||
          "Preview transform did not emit executable code.";
        throw new Error(`Transform mode ${options.transformMode ?? "compatibility"} blocked ${filePath}.\n${diagnosticMessage}`);
      }

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
