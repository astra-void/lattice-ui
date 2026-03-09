import fs from "node:fs";
import { createHash } from "node:crypto";
import {
  transformPreviewSource,
  type PreviewTransformDiagnostic,
  type PreviewTransformOutcome,
} from "@lattice-ui/compiler";
import { discoverWorkspaceState, type DiscoveredEntryState, type WorkspaceDiscoverySnapshot } from "./discover";
import { resolveRealFilePath } from "./pathUtils";
import { PREVIEW_ENGINE_PROTOCOL_VERSION } from "./types";
import { isTransformableSourceFile } from "./workspaceGraph";
import type {
  CreatePreviewEngineOptions,
  PreviewDiagnostic,
  PreviewEngine,
  PreviewEngineUpdate,
  PreviewEngineUpdateListener,
  PreviewExecutionMode,
  PreviewEntryPayload,
  PreviewEntryStatus,
  PreviewSourceTarget,
  PreviewTransformState,
  PreviewWorkspaceIndex,
} from "./types";

type SnapshotState = WorkspaceDiscoverySnapshot & {
  targetsByFilePath: Map<string, PreviewSourceTarget>;
};

type CachedPayload = {
  hash: string;
  payload: PreviewEntryPayload;
};

function hashText(value: string) {
  return createHash("sha1").update(value).digest("hex");
}

function buildSnapshot(options: CreatePreviewEngineOptions): SnapshotState {
  const discovery = discoverWorkspaceState(options);
  const targetsByFilePath = new Map<string, PreviewSourceTarget>();

  for (const state of discovery.entryStatesById.values()) {
    for (const dependencyPath of state.dependencyPaths) {
      if (!targetsByFilePath.has(dependencyPath)) {
        targetsByFilePath.set(dependencyPath, {
          name: state.target.targetName,
          packageName: state.target.packageName,
          packageRoot: state.target.packageRoot,
          sourceRoot: state.target.sourceRoot,
        });
      }
    }
  }

  return {
    ...discovery,
    targetsByFilePath,
  };
}

function collectImpactedEntryIds(snapshot: SnapshotState | undefined, filePaths: string[]) {
  if (!snapshot) {
    return [];
  }

  const normalizedPaths = new Set(filePaths.map((filePath) => resolveRealFilePath(filePath)));
  const impacted = new Set<string>();

  for (const [entryId, dependencyPaths] of snapshot.entryDependencyPathsById.entries()) {
    if (dependencyPaths.some((dependencyPath) => normalizedPaths.has(resolveRealFilePath(dependencyPath)))) {
      impacted.add(entryId);
    }
  }

  return [...impacted].sort((left, right) => left.localeCompare(right));
}

function toTransformDiagnostic(
  entryState: DiscoveredEntryState,
  entryId: string,
  diagnostic: PreviewTransformDiagnostic,
): PreviewDiagnostic {
  return {
    code: diagnostic.code,
    entryId,
    file: diagnostic.file,
    ...(diagnostic.blocking === undefined ? {} : { blocking: diagnostic.blocking }),
    ...(diagnostic.details === undefined ? {} : { details: diagnostic.details }),
    phase: "transform",
    relativeFile: relativeToPackage(entryState.packageRoot, diagnostic.file),
    severity: diagnostic.severity,
    summary: diagnostic.summary,
    ...(diagnostic.symbol === undefined ? {} : { symbol: diagnostic.symbol }),
    target: diagnostic.target,
  };
}

function relativeToPackage(packageRoot: string, filePath: string) {
  const normalizedPackageRoot = resolveRealFilePath(packageRoot).replace(/\\/g, "/");
  const normalizedFilePath = resolveRealFilePath(filePath).replace(/\\/g, "/");
  if (normalizedFilePath.startsWith(`${normalizedPackageRoot}/`)) {
    return normalizedFilePath.slice(normalizedPackageRoot.length + 1);
  }

  return normalizedFilePath;
}

function createPayloadHash(entryState: DiscoveredEntryState) {
  const dependencyHashes = entryState.dependencyPaths
    .map((dependencyPath) => {
      const sourceText = fs.existsSync(dependencyPath) ? fs.readFileSync(dependencyPath, "utf8") : "";
      return `${dependencyPath}:${hashText(sourceText)}`;
    })
    .join("|");

  return hashText(
    JSON.stringify({
      dependencyHashes,
      descriptor: entryState.descriptor,
      discoveryDiagnostics: entryState.discoveryDiagnostics,
      graphTrace: entryState.graphTrace,
      previewHasProps: entryState.previewHasProps,
    }),
  );
}

function createDefaultTransformOutcome(mode: PreviewExecutionMode): PreviewTransformOutcome {
  if (mode === "design-time") {
    return {
      fidelity: "metadata-only",
      kind: "design-time",
    };
  }

  return {
    fidelity: "preserved",
    kind: "ready",
  };
}

function mergeTransformOutcome(
  current: PreviewTransformOutcome,
  next: PreviewTransformOutcome,
  mode: PreviewExecutionMode,
): PreviewTransformOutcome {
  if (mode === "design-time") {
    return createDefaultTransformOutcome(mode);
  }

  if (current.kind === "blocked" || next.kind === "blocked") {
    return {
      fidelity: "degraded",
      kind: "blocked",
    };
  }

  if (next.kind === "mocked" || current.kind === "mocked") {
    return {
      fidelity: next.fidelity === "degraded" || current.fidelity === "degraded" ? "degraded" : "preserved",
      kind: "mocked",
    };
  }

  if (next.kind === "compatibility" || current.kind === "compatibility") {
    return {
      fidelity: "degraded",
      kind: "compatibility",
    };
  }

  return {
    fidelity: next.fidelity === "degraded" || current.fidelity === "degraded" ? "degraded" : "preserved",
    kind: "ready",
  };
}

function computeTransformState(
  entryState: DiscoveredEntryState,
  entryId: string,
  runtimeModule: string,
  mode: PreviewExecutionMode,
) {
  const diagnostics = new Map<string, PreviewDiagnostic>();
  let outcome = createDefaultTransformOutcome(mode);

  for (const dependencyPath of entryState.dependencyPaths) {
    if (!fs.existsSync(dependencyPath) || !isTransformableSourceFile(dependencyPath)) {
      continue;
    }

    const sourceText = fs.readFileSync(dependencyPath, "utf8");
    const transformed = transformPreviewSource(sourceText, {
      filePath: dependencyPath,
      mode,
      runtimeModule,
      target: entryState.target.targetName,
    });
    outcome = mergeTransformOutcome(outcome, transformed.outcome, mode);

    for (const diagnostic of transformed.diagnostics) {
      const nextDiagnostic = toTransformDiagnostic(entryState, entryId, diagnostic);
      const key = `${nextDiagnostic.file}:${nextDiagnostic.code}:${nextDiagnostic.summary}:${nextDiagnostic.symbol ?? ""}`;
      diagnostics.set(key, nextDiagnostic);
    }
  }

  return {
    diagnostics: [...diagnostics.values()].sort((left, right) => {
      if (left.relativeFile !== right.relativeFile) {
        return left.relativeFile.localeCompare(right.relativeFile);
      }

      return left.code.localeCompare(right.code);
    }),
    outcome,
  };
}

function mergeDiagnostics(entryState: DiscoveredEntryState, transformDiagnostics: PreviewDiagnostic[]) {
  const diagnostics = [...entryState.discoveryDiagnostics, ...transformDiagnostics];
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
    diagnostics,
    diagnosticsSummary: {
      byPhase,
      hasBlocking: diagnostics.some((diagnostic) => diagnostic.blocking === true || diagnostic.severity === "error"),
      total: diagnostics.length,
    },
  };
}

function resolvePayloadStatus(baseStatus: PreviewEntryStatus, transform: PreviewTransformState) {
  if (transform.outcome.kind !== "blocked" && transform.outcome.kind !== "design-time") {
    return baseStatus;
  }

  if (baseStatus === "ready") {
    return "blocked_by_transform" as const;
  }

  return baseStatus;
}

class PreviewEngineImpl implements PreviewEngine {
  private readonly listeners = new Set<PreviewEngineUpdateListener>();
  private readonly payloadCache = new Map<string, CachedPayload>();
  private snapshot: SnapshotState;

  public constructor(private readonly options: CreatePreviewEngineOptions) {
    this.snapshot = buildSnapshot(options);
  }

  public dispose() {
    this.listeners.clear();
    this.payloadCache.clear();
  }

  public getEntryPayload(entryId: string) {
    const entryState = this.snapshot.entryStatesById.get(entryId);
    if (!entryState) {
      throw new Error(`Unknown preview entry: ${entryId}`);
    }

    const payloadHash = createPayloadHash(entryState);
    const cachedPayload = this.payloadCache.get(entryId);
    if (cachedPayload?.hash === payloadHash) {
      return cachedPayload.payload;
    }

    const transform = computeTransformState(
      entryState,
      entryId,
      this.options.runtimeModule ?? "virtual:lattice-preview-runtime",
      this.options.transformMode ?? "compatibility",
    );
    const merged = mergeDiagnostics(entryState, transform.diagnostics);
    const payload: PreviewEntryPayload = {
      descriptor: {
        ...entryState.descriptor,
        diagnosticsSummary: merged.diagnosticsSummary,
        status: resolvePayloadStatus(entryState.descriptor.status, {
          mode: this.options.transformMode ?? "compatibility",
          outcome: transform.outcome,
        }),
      },
      diagnostics: merged.diagnostics,
      graphTrace: entryState.graphTrace,
      protocolVersion: PREVIEW_ENGINE_PROTOCOL_VERSION,
      runtimeAdapter: {
        kind: "react-dom",
        moduleId: this.options.runtimeModule ?? "virtual:lattice-preview-runtime",
      },
      transform: {
        mode: this.options.transformMode ?? "compatibility",
        outcome: transform.outcome,
      },
    };

    this.payloadCache.set(entryId, {
      hash: payloadHash,
      payload,
    });

    return payload;
  }

  public getTargetForFilePath(filePath: string) {
    return this.snapshot.targetsByFilePath.get(resolveRealFilePath(filePath));
  }

  public getWorkspaceIndex() {
    const entries = this.snapshot.workspaceIndex.entries.map((entry) => this.getEntryPayload(entry.id).descriptor);
    return {
      ...this.snapshot.workspaceIndex,
      entries,
    } satisfies PreviewWorkspaceIndex;
  }

  public invalidateFiles(filePaths: string[]) {
    const previousSnapshot = this.snapshot;
    const previousWorkspaceIndex = this.getWorkspaceIndex();
    const previousWorkspaceJson = JSON.stringify(previousWorkspaceIndex.entries);
    const previouslyImpactedIds = collectImpactedEntryIds(previousSnapshot, filePaths);

    this.snapshot = buildSnapshot(this.options);

    const nextWorkspaceIndex = this.getWorkspaceIndex();
    const nextWorkspaceJson = JSON.stringify(nextWorkspaceIndex.entries);
    const newlyImpactedIds = collectImpactedEntryIds(this.snapshot, filePaths);
    const removedEntryIds = [...previousSnapshot.entryStatesById.keys()]
      .filter((entryId) => !this.snapshot.entryStatesById.has(entryId))
      .sort((left, right) => left.localeCompare(right));
    const changedEntryIds = new Set<string>([...previouslyImpactedIds, ...newlyImpactedIds]);
    const previousEntriesById = new Map(previousWorkspaceIndex.entries.map((entry) => [entry.id, entry]));

    for (const entry of nextWorkspaceIndex.entries) {
      const previousEntry = previousEntriesById.get(entry.id);
      if (!previousEntry || JSON.stringify(previousEntry) !== JSON.stringify(entry)) {
        changedEntryIds.add(entry.id);
      }
    }

    for (const entryId of [...changedEntryIds, ...removedEntryIds]) {
      this.payloadCache.delete(entryId);
    }

    const update: PreviewEngineUpdate = {
      changedEntryIds: [...changedEntryIds].sort((left, right) => left.localeCompare(right)),
      protocolVersion: PREVIEW_ENGINE_PROTOCOL_VERSION,
      removedEntryIds,
      requiresFullReload: false,
      workspaceChanged: previousWorkspaceJson !== nextWorkspaceJson || removedEntryIds.length > 0,
      workspaceIndex: nextWorkspaceIndex,
    };

    for (const listener of this.listeners) {
      listener(update);
    }

    return update;
  }

  public onUpdate(listener: PreviewEngineUpdateListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export function createPreviewEngine(options: CreatePreviewEngineOptions): PreviewEngine {
  return new PreviewEngineImpl({
    ...options,
    selectionMode: options.selectionMode ?? "compat",
    transformMode: options.transformMode ?? "compatibility",
  });
}
