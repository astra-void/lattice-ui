import { createPreviewEngine, PREVIEW_ENGINE_PROTOCOL_VERSION, type PreviewEngine, type PreviewEntryPayload } from "@lattice-ui/preview-engine";
import type { ResolvedPreviewConfig } from "./config";
import type { StartPreviewServerInput } from "./source/server";
import { resolvePreviewServerConfig } from "./source/server";

export type PreviewHeadlessSnapshot = {
  entries: Record<string, PreviewEntryPayload>;
  protocolVersion: number;
  workspaceIndex: ReturnType<PreviewEngine["getWorkspaceIndex"]>;
};

export type PreviewHeadlessSession = {
  dispose(): void;
  engine: PreviewEngine;
  getSnapshot(): PreviewHeadlessSnapshot;
  resolvedConfig: ResolvedPreviewConfig;
};

export type CreatePreviewHeadlessSessionOptions = StartPreviewServerInput;

function createSnapshot(engine: PreviewEngine): PreviewHeadlessSnapshot {
  const workspaceIndex = engine.getWorkspaceIndex();
  return {
    entries: Object.fromEntries(workspaceIndex.entries.map((entry) => [entry.id, engine.getEntryPayload(entry.id)])),
    protocolVersion: PREVIEW_ENGINE_PROTOCOL_VERSION,
    workspaceIndex,
  };
}

export async function createPreviewHeadlessSession(
  options: CreatePreviewHeadlessSessionOptions = {},
): Promise<PreviewHeadlessSession> {
  const resolvedConfig = await resolvePreviewServerConfig(options);
  const engine = createPreviewEngine({
    projectName: resolvedConfig.projectName,
    runtimeModule: resolvedConfig.runtimeModule,
    targets: resolvedConfig.targets,
    transformMode: resolvedConfig.transformMode,
  });

  return {
    dispose() {
      engine.dispose();
    },
    engine,
    getSnapshot() {
      return createSnapshot(engine);
    },
    resolvedConfig,
  };
}
