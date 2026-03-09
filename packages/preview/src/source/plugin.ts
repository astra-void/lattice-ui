import fs from "node:fs";
import path from "node:path";
import { stripFileIdDecorations } from "./pathUtils";
import {
  createUnresolvedPackageMockResolvePlugin,
  createUnresolvedPackageMockTransformPlugin,
} from "./robloxPackageMockPlugin";
import { PreviewSourceIndex } from "./sourceIndex";
import type { PreviewSourceTarget } from "./types";
import type { PreviewDevServer, PreviewPlugin, PreviewPluginOption } from "./viteTypes";

const REGISTRY_MODULE_ID = "virtual:lattice-preview-registry";
const RESOLVED_REGISTRY_MODULE_ID = `\0${REGISTRY_MODULE_ID}`;
const RUNTIME_MODULE_ID = "virtual:lattice-preview-runtime";
const RESOLVED_RUNTIME_MODULE_ID = `\0${RUNTIME_MODULE_ID}`;
const ENTRY_MODULE_ID_PREFIX = "virtual:lattice-preview-entry:";
const RESOLVED_ENTRY_MODULE_ID_PREFIX = `\0${ENTRY_MODULE_ID_PREFIX}`;

export type CreatePreviewVitePluginOptions = {
  projectName: string;
  targets: PreviewSourceTarget[];
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

function renderRegistryModule(sourceIndex: PreviewSourceIndex) {
  const workspace = sourceIndex.getWorkspace();
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

function renderEntryModule(sourceIndex: PreviewSourceIndex, entryId: string) {
  const entry = sourceIndex.getWorkspace().entries.find((candidate) => candidate.id === entryId);
  if (!entry) {
    throw new Error(`No preview entry registered for \`${entryId}\`.`);
  }

  const meta = sourceIndex.getEntryMeta(entryId);
  const sourceFilePath = entry.sourceFilePath.split(path.sep).join("/");

  return `import * as __previewModule from ${JSON.stringify(sourceFilePath)};
export * from ${JSON.stringify(sourceFilePath)};
const __previewDefault = __previewModule.default;
export default __previewDefault;
export const __previewEntryMeta = ${JSON.stringify(meta, null, 2)};
`;
}

export function createPreviewVitePlugin(options: CreatePreviewVitePluginOptions): PreviewPluginOption {
  const runtimeEntryPath = resolveRuntimeEntryPath();
  const mockEntryPath = resolveMockEntryPath();
  const sourceIndex = new PreviewSourceIndex(options);
  let server: PreviewDevServer | undefined;

  const invalidateVirtualModules = (filePath: string) => {
    if (!server) {
      return;
    }

    const registryModule = server.moduleGraph.getModuleById(RESOLVED_REGISTRY_MODULE_ID);
    if (registryModule) {
      server.moduleGraph.invalidateModule(registryModule);
    }

    for (const entryId of sourceIndex.getImpactedEntryIds(filePath)) {
      const entryModule = server.moduleGraph.getModuleById(
        `${RESOLVED_ENTRY_MODULE_ID_PREFIX}${encodeURIComponent(entryId)}`,
      );
      if (entryModule) {
        server.moduleGraph.invalidateModule(entryModule);
      }
    }
  };

  const refreshSourceIndex = (filePath: string) => {
    const previousHash = sourceIndex.getWorkspaceHash();
    invalidateVirtualModules(filePath);
    sourceIndex.invalidateFile(filePath);
    const nextHash = sourceIndex.getWorkspaceHash();

    if (server && previousHash !== nextHash) {
      server.ws.send({ type: "full-reload" });
    }

    return previousHash !== nextHash;
  };

  const previewPlugin: PreviewPlugin = {
    name: "lattice-preview-source-first",
    enforce: "pre",
    configureServer(configuredServer: PreviewDevServer) {
      server = configuredServer;
      configuredServer.watcher.on("add", (filePath: string) => {
        if (sourceIndex.findTargetForFilePath(filePath)) {
          refreshSourceIndex(filePath);
        }
      });
      configuredServer.watcher.on("unlink", (filePath: string) => {
        if (sourceIndex.findTargetForFilePath(filePath)) {
          refreshSourceIndex(filePath);
        }
      });
    },
    handleHotUpdate(context: { file: string }) {
      if (sourceIndex.findTargetForFilePath(context.file)) {
        if (refreshSourceIndex(context.file)) {
          // Avoid rendering a mixed old-registry/new-module state before the forced reload completes.
          return [];
        }
      }

      return undefined;
    },
    load(id: string) {
      if (id === RESOLVED_REGISTRY_MODULE_ID) {
        return renderRegistryModule(sourceIndex).code;
      }

      if (id === RESOLVED_RUNTIME_MODULE_ID) {
        return `export * from ${JSON.stringify(resolveRuntimeEntryPath())};\n`;
      }

      if (id.startsWith(RESOLVED_ENTRY_MODULE_ID_PREFIX)) {
        const entryId = decodeURIComponent(id.slice(RESOLVED_ENTRY_MODULE_ID_PREFIX.length));
        return renderEntryModule(sourceIndex, entryId);
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
        return `${RESOLVED_ENTRY_MODULE_ID_PREFIX}${id.slice(ENTRY_MODULE_ID_PREFIX.length)}`;
      }

      return undefined;
    },
    transform(code: string, id: string) {
      const filePath = stripFileIdDecorations(id);
      const target = sourceIndex.findTargetForFilePath(filePath);
      if (!target) {
        return undefined;
      }

      const transformed = sourceIndex.getTransformedModule({
        code,
        filePath,
        runtimeModule: runtimeEntryPath,
        target,
      });

      return {
        code: transformed.code,
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
