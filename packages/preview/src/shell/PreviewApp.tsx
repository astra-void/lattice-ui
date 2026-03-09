import {
  AutoMockProvider,
  areViewportsEqual,
  createViewportSize,
  createWindowViewport,
  isViewportLargeEnough,
  LayoutProvider,
  measureElementViewport,
  pickViewport,
  type ViewportSize,
} from "@lattice-ui/preview-runtime";
import React from "react";
import type {
  PreviewDefinition,
  PreviewDiscoveryDiagnostic,
  PreviewEntryStatus,
  PreviewRegistryItem,
} from "../source/types";
import { PreviewThemeControl } from "./theme";

type PreviewModule = Record<string, unknown> & {
  default?: unknown;
  preview?: PreviewDefinition;
};

type PreviewAppProps = {
  entries: PreviewRegistryItem[];
  initialSelectedId?: string;
  loadModule: (id: string) => Promise<PreviewModule>;
  projectName: string;
};

type PreviewCanvasProps = {
  entry: PreviewRegistryItem;
  isDebugMode: boolean;
  module: PreviewModule;
  onRenderError: (message: string | null) => void;
};

type PreviewErrorBoundaryProps = {
  children: React.ReactNode;
  onError: (message: string | null) => void;
};

type PreviewErrorBoundaryState = {
  errorMessage: string | null;
};

class PreviewErrorBoundary extends React.Component<PreviewErrorBoundaryProps, PreviewErrorBoundaryState> {
  constructor(props: PreviewErrorBoundaryProps) {
    super(props);
    this.state = {
      errorMessage: null,
    };
  }

  static getDerivedStateFromError(error: unknown): PreviewErrorBoundaryState {
    return {
      errorMessage: error instanceof Error ? error.message : "Unknown preview render error.",
    };
  }

  componentDidCatch(error: unknown) {
    this.props.onError(error instanceof Error ? error.message : "Unknown preview render error.");
  }

  componentDidUpdate(previousProps: PreviewErrorBoundaryProps) {
    if (previousProps.children !== this.props.children && this.state.errorMessage) {
      this.setState({ errorMessage: null });
      this.props.onError(null);
    }
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <div className="preview-empty">
          <p className="preview-empty-eyebrow">Render error</p>
          <h2>Preview render failed.</h2>
          <p>{this.state.errorMessage}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

function getInitialSelectedId(entries: PreviewRegistryItem[], explicitSelectedId?: string) {
  if (explicitSelectedId && entries.some((entry) => entry.id === explicitSelectedId)) {
    return explicitSelectedId;
  }

  if (typeof window !== "undefined") {
    const searchParams = new URLSearchParams(window.location.search);
    const selectedPath = searchParams.get("path");
    if (selectedPath && entries.some((entry) => entry.id === selectedPath)) {
      return selectedPath;
    }
  }

  return entries[0]?.id;
}

function readPreviewDefinition(module: PreviewModule) {
  const preview =
    module.preview ??
    (module.default && typeof module.default === "object" && "preview" in module.default
      ? (module.default as PreviewModule).preview
      : undefined);

  if (!preview || typeof preview !== "object") {
    return undefined;
  }

  return preview;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNestedExport(container: unknown, exportName: string, visited = new Set<unknown>()): unknown {
  if (!isRecord(container) || visited.has(container)) {
    return undefined;
  }

  visited.add(container);

  if (exportName in container) {
    return container[exportName];
  }

  if (!("default" in container)) {
    return undefined;
  }

  const defaultExport = container.default;
  if (typeof defaultExport === "function" && defaultExport.name === exportName) {
    return defaultExport;
  }

  return readNestedExport(defaultExport, exportName, visited);
}

function readModuleExport(module: PreviewModule, exportName: "default" | string) {
  if (exportName === "default") {
    return module.default;
  }

  return readNestedExport(module, exportName);
}

function isRenderableComponentExport(value: unknown): boolean {
  return typeof value === "function" || (isRecord(value) && "$$typeof" in value);
}

function collectRenderableModuleExports(
  container: unknown,
  exportPrefix = "",
  visited = new Set<unknown>(),
): Array<{ exportName: string; value: unknown }> {
  if (!isRecord(container) || visited.has(container)) {
    return [];
  }

  visited.add(container);

  const renderableExports: Array<{ exportName: string; value: unknown }> = [];

  for (const [name, value] of Object.entries(container)) {
    if (name === "__esModule" || name === "preview") {
      continue;
    }

    const exportName = exportPrefix ? `${exportPrefix}.${name}` : name;
    if (name === "default") {
      if (isRenderableComponentExport(value)) {
        renderableExports.push({ exportName: exportPrefix ? exportName : "default", value });
      }

      renderableExports.push(...collectRenderableModuleExports(value, exportName, visited));
      continue;
    }

    if (isRenderableComponentExport(value)) {
      renderableExports.push({ exportName, value });
    }
  }

  return renderableExports;
}

function readSingleRenderableModuleExport(module: PreviewModule) {
  const seenValues = new Set<unknown>();
  const renderableExports = collectRenderableModuleExports(module).filter(({ value }) => {
    if (seenValues.has(value)) {
      return false;
    }

    seenValues.add(value);
    return true;
  });

  return renderableExports.length === 1 ? renderableExports[0] : undefined;
}

function describeValue(value: unknown) {
  if (value === undefined) {
    return "undefined";
  }

  if (value === null) {
    return "null";
  }

  if (typeof value === "function") {
    return value.name ? `function ${value.name}` : "function";
  }

  if (Array.isArray(value)) {
    return "array";
  }

  if (isRecord(value)) {
    const keys = Object.keys(value).sort();
    return keys.length > 0 ? `object with keys [${keys.join(", ")}]` : "object";
  }

  return typeof value;
}

function describeModuleExports(module: PreviewModule) {
  const segments: string[] = [];
  const visited = new Set<unknown>();
  let current: unknown = module;
  let label = "module";

  while (isRecord(current) && !visited.has(current)) {
    visited.add(current);
    const keys = Object.keys(current).sort();
    segments.push(`${label}: [${keys.join(", ") || "(none)"}]`);

    if (!("default" in current)) {
      break;
    }

    current = current.default;
    label = `${label}.default`;
  }

  return segments.join("; ");
}

function getRenderModeLabel(entry: PreviewRegistryItem) {
  if (entry.render.mode === "preview-render") {
    return "preview.render";
  }

  if (entry.render.mode === "auto" && entry.render.exportName === "default") {
    return "default export";
  }

  if (entry.render.mode === "auto") {
    return entry.render.exportName;
  }

  return "none";
}

function getStatusLabel(status: PreviewEntryStatus) {
  switch (status) {
    case "ready":
      return "ready";
    case "needs-harness":
      return "needs harness";
    case "ambiguous":
      return "ambiguous";
    case "error":
      return "error";
  }
}

function getPrimaryDiscoveryDiagnostic(entry: PreviewRegistryItem) {
  const priority: Record<PreviewDiscoveryDiagnostic["code"], number> = {
    AMBIGUOUS_COMPONENT_EXPORTS: 0,
    PREVIEW_RENDER_MISSING: 1,
    NO_COMPONENT_EXPORTS: 2,
    TRANSITIVE_ANALYSIS_LIMITED: 3,
  };
  const discoveryDiagnostics = entry.discoveryDiagnostics ?? [];

  return [...discoveryDiagnostics].sort((left, right) => {
    const priorityDelta = priority[left.code] - priority[right.code];
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return left.message.localeCompare(right.message);
  })[0];
}

function getEntryEmptyState(entry: PreviewRegistryItem) {
  const primaryDiscoveryDiagnostic = getPrimaryDiscoveryDiagnostic(entry);

  if (entry.status === "ambiguous") {
    return {
      body:
        primaryDiscoveryDiagnostic?.message ??
        "Export a default component or add `preview.render` to pick the intended preview target.",
      eyebrow: "Ambiguous",
      title: "Multiple component exports need disambiguation.",
    };
  }

  if (entry.status === "needs-harness") {
    if (primaryDiscoveryDiagnostic?.code === "PREVIEW_RENDER_MISSING") {
      return {
        body: `${primaryDiscoveryDiagnostic.message} Add \`preview.render\` or expose one default/sole component export.`,
        eyebrow: "Needs harness",
        title: "The preview export is incomplete.",
      };
    }

    if (primaryDiscoveryDiagnostic?.code === "NO_COMPONENT_EXPORTS") {
      return {
        body: `${primaryDiscoveryDiagnostic.message} Add a default export or \`preview.render\` for composed demos.`,
        eyebrow: "Needs harness",
        title: "This file is not directly previewable yet.",
      };
    }

    return {
      body:
        primaryDiscoveryDiagnostic?.message ??
        "Add a default export or `export const preview = { render: ... }` when the file needs explicit harnessing.",
      eyebrow: "Needs harness",
      title: "This file is not directly previewable yet.",
    };
  }

  return {
    body: "Fix the unsupported patterns below, then save again.",
    eyebrow: "Diagnostics",
    title: "Transform diagnostics are blocking this preview.",
  };
}

function createPreviewNode(entry: PreviewRegistryItem, module: PreviewModule) {
  const preview = readPreviewDefinition(module);

  if (entry.render.mode === "preview-render") {
    if (!preview?.render || typeof preview.render !== "function") {
      throw new Error(
        "This entry is marked as preview.render but the module does not export a callable preview.render.",
      );
    }

    const Harness = preview.render as React.ComponentType;
    return <Harness />;
  }

  if (entry.render.mode === "auto") {
    const exportValue = readModuleExport(module, entry.render.exportName);
    // Preview source edits can briefly update the module before the registry full-reload lands.
    const fallbackExport = exportValue === undefined ? readSingleRenderableModuleExport(module) : undefined;
    const resolvedExportValue = fallbackExport?.value ?? exportValue;

    if (!isRenderableComponentExport(resolvedExportValue)) {
      throw new Error(
        `Expected \`${entry.render.exportName}\` to be a component export, received ${describeValue(exportValue)}. ` +
          `Available exports: ${describeModuleExports(module)}.`,
      );
    }

    const props =
      entry.render.usesPreviewProps && preview?.props && typeof preview.props === "object" ? preview.props : undefined;

    return (
      <AutoMockProvider component={resolvedExportValue as React.ComponentType<Record<string, unknown>>} props={props} />
    );
  }

  return null;
}

function usePreviewViewport() {
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = React.useState<ViewportSize>(() => createWindowViewport());
  const lastStableViewportRef = React.useRef<ViewportSize>(viewport);

  React.useLayoutEffect(() => {
    const element = viewportRef.current;
    if (!element) {
      return;
    }

    const update = (nextMeasuredViewport?: ViewportSize | null) => {
      const measuredViewport = nextMeasuredViewport ?? measureElementViewport(element);
      const nextViewport = pickViewport([measuredViewport, lastStableViewportRef.current], createWindowViewport());

      if (isViewportLargeEnough(nextViewport)) {
        lastStableViewportRef.current = nextViewport;
      }

      setViewport((previous) => (areViewportsEqual(previous, nextViewport) ? previous : nextViewport));
    };

    update();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver((entries) => {
        const entry = entries.find((candidate) => candidate.target === element) ?? entries[0];
        update(createViewportSize(entry?.contentRect.width, entry?.contentRect.height));
      });
      observer.observe(element);
      return () => {
        observer.disconnect();
      };
    }

    const onWindowResize = () => {
      update();
    };

    window.addEventListener("resize", onWindowResize);
    return () => {
      window.removeEventListener("resize", onWindowResize);
    };
  }, []);

  React.useEffect(() => {
    console.log("Measured Canvas Size:", viewport.width, viewport.height);
  }, [viewport.height, viewport.width]);

  return {
    viewport,
    viewportRef,
  };
}

function PreviewCanvas(props: PreviewCanvasProps) {
  const preview = readPreviewDefinition(props.module);
  const { viewport, viewportRef } = usePreviewViewport();
  const subtitle =
    props.entry.render.mode === "preview-render"
      ? "Custom harness"
      : props.entry.render.mode === "auto" && props.entry.render.usesPreviewProps
        ? "Auto render with preview.props"
        : "Auto render";

  return (
    <div className="preview-canvas">
      <div className="canvas-meta">
        <div>
          <p className="meta-label">Target</p>
          <p className="meta-value">{props.entry.targetName}</p>
        </div>
        <div>
          <p className="meta-label">Render</p>
          <p className="meta-value">{getRenderModeLabel(props.entry)}</p>
        </div>
        <div>
          <p className="meta-label">Mode</p>
          <p className="meta-value">{subtitle}</p>
        </div>
        <div>
          <p className="meta-label">Title</p>
          <p className="meta-value">{preview?.title ?? props.entry.title}</p>
        </div>
      </div>
      <div className="preview-stage">
        <div
          className="preview-stage-viewport"
          data-debug-mode={props.isDebugMode ? "true" : undefined}
          data-preview-stage-height={viewport.height}
          data-preview-stage-width={viewport.width}
          ref={viewportRef}
        >
          <LayoutProvider viewportHeight={viewport.height} viewportWidth={viewport.width}>
            <PreviewErrorBoundary onError={props.onRenderError}>
              {createPreviewNode(props.entry, props.module)}
            </PreviewErrorBoundary>
          </LayoutProvider>
        </div>
      </div>
    </div>
  );
}

export function PreviewApp(props: PreviewAppProps) {
  const [selectedId, setSelectedId] = React.useState(() =>
    getInitialSelectedId(props.entries, props.initialSelectedId),
  );
  const [isDebugMode, setIsDebugMode] = React.useState(false);
  const [loadedModule, setLoadedModule] = React.useState<PreviewModule | undefined>();
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [renderError, setRenderError] = React.useState<string | null>(null);
  const selectedEntry = props.entries.find((entry) => entry.id === selectedId) ?? props.entries[0];
  const selectedEntryDiscoveryDiagnostics = selectedEntry?.discoveryDiagnostics ?? [];
  const emptyState = selectedEntry ? getEntryEmptyState(selectedEntry) : undefined;

  React.useEffect(() => {
    if (!selectedEntry || typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set("path", selectedEntry.id);
    window.history.replaceState({}, "", url);
  }, [selectedEntry]);

  React.useEffect(() => {
    if (!selectedEntry || selectedEntry.status !== "ready") {
      setLoadedModule(undefined);
      setLoadError(null);
      setRenderError(null);
      return;
    }

    let cancelled = false;
    setLoadedModule(undefined);
    setLoadError(null);
    setRenderError(null);

    props
      .loadModule(selectedEntry.id)
      .then((module) => {
        if (!cancelled) {
          setLoadedModule(module);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Unknown preview load error.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [props, selectedEntry]);

  return (
    <main className="preview-shell">
      <aside className="preview-sidebar">
        <div className="sidebar-header">
          <p className="sidebar-eyebrow">Lattice Preview</p>
          <h1>{props.projectName}</h1>
          <p>Compiler-driven preview for transformed `@rbxts/react` source files.</p>
        </div>
        <nav aria-label="Preview entries" className="sidebar-list">
          {props.entries.map((entry) => (
            <button
              className={`sidebar-item ${entry.id === selectedEntry?.id ? "is-selected" : ""}`}
              key={entry.id}
              onClick={() => React.startTransition(() => setSelectedId(entry.id))}
              type="button"
            >
              <span className={`status-pill status-${entry.status}`}>{getStatusLabel(entry.status)}</span>
              <span className="sidebar-item-copy">
                <span className="sidebar-item-title">{entry.title}</span>
                <span className="sidebar-item-target">{entry.targetName}</span>
                <span className="sidebar-item-path">{entry.relativePath}</span>
              </span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="preview-main">
        {selectedEntry ? (
          <>
            <header className="preview-header">
              <div>
                <p className="section-eyebrow">Selected file</p>
                <h2>{selectedEntry.title}</h2>
              </div>
              <div className="header-controls">
                <PreviewThemeControl />
                <label className="debug-toggle">
                  <input
                    checked={isDebugMode}
                    onChange={(event) => setIsDebugMode(event.target.checked)}
                    type="checkbox"
                  />
                  <span>Debug mode</span>
                </label>
                <div className="header-meta">
                  <span>{selectedEntry.targetName}</span>
                  <span>{selectedEntry.relativePath}</span>
                  <span>{selectedEntry.hasPreviewExport ? "Has preview export" : "Direct export render"}</span>
                </div>
              </div>
            </header>

            <section className="preview-card">
              {selectedEntry.status === "ready" ? (
                loadedModule ? (
                  <PreviewCanvas
                    entry={selectedEntry}
                    isDebugMode={isDebugMode}
                    module={loadedModule}
                    onRenderError={setRenderError}
                  />
                ) : loadError ? (
                  <div className="preview-empty">
                    <p className="preview-empty-eyebrow">Load error</p>
                    <h2>Preview module failed to load.</h2>
                    <p>{loadError}</p>
                  </div>
                ) : (
                  <div className="preview-empty">
                    <p className="preview-empty-eyebrow">Loading</p>
                    <h2>Preparing transformed source.</h2>
                    <p>The selected `@rbxts/react` module is being compiled into the web preview runtime.</p>
                  </div>
                )
              ) : selectedEntry.status === "needs-harness" || selectedEntry.status === "ambiguous" ? (
                <div className="preview-empty">
                  <p className="preview-empty-eyebrow">{emptyState?.eyebrow}</p>
                  <h2>{emptyState?.title}</h2>
                  <p>{emptyState?.body}</p>
                </div>
              ) : (
                <div className="preview-empty">
                  <p className="preview-empty-eyebrow">{emptyState?.eyebrow}</p>
                  <h2>{emptyState?.title}</h2>
                  <p>{emptyState?.body}</p>
                </div>
              )}
            </section>

            <section className="diagnostics-card">
              <div className="diagnostics-header">
                <div>
                  <p className="section-eyebrow">Diagnostics</p>
                  <h3>Source analysis</h3>
                </div>
                <div className="diagnostics-summary">
                  <span>{selectedEntry.diagnostics.length} blocking issue(s)</span>
                  <span>{selectedEntryDiscoveryDiagnostics.length} discover note(s)</span>
                  {renderError ? <span>render error</span> : undefined}
                  {loadError ? <span>load error</span> : undefined}
                </div>
              </div>
              {selectedEntry.diagnostics.length === 0 &&
              selectedEntryDiscoveryDiagnostics.length === 0 &&
              !renderError &&
              !loadError ? (
                <p className="diagnostics-empty">No diagnostics for this entry.</p>
              ) : (
                <div className="diagnostics-list">
                  {selectedEntry.diagnostics.map((diagnostic) => (
                    <article
                      className="diagnostic-item"
                      key={`${diagnostic.relativeFile}:${diagnostic.line}:${diagnostic.column}:${diagnostic.code}`}
                    >
                      <p className="diagnostic-code">{diagnostic.code}</p>
                      <p className="diagnostic-message">{diagnostic.message}</p>
                      <p className="diagnostic-location">
                        {diagnostic.relativeFile}:{diagnostic.line}:{diagnostic.column}
                      </p>
                    </article>
                  ))}
                  {selectedEntryDiscoveryDiagnostics.map((diagnostic) => (
                    <article
                      className="diagnostic-item diagnostic-item-discovery"
                      key={`${diagnostic.relativeFile}:${diagnostic.code}:${diagnostic.message}`}
                    >
                      <p className="diagnostic-code">{diagnostic.code}</p>
                      <p className="diagnostic-message">{diagnostic.message}</p>
                      <p className="diagnostic-location">{diagnostic.relativeFile}</p>
                    </article>
                  ))}
                  {loadError ? (
                    <article className="diagnostic-item diagnostic-item-runtime">
                      <p className="diagnostic-code">LOAD_ERROR</p>
                      <p className="diagnostic-message">{loadError}</p>
                    </article>
                  ) : undefined}
                  {renderError ? (
                    <article className="diagnostic-item diagnostic-item-runtime">
                      <p className="diagnostic-code">RENDER_ERROR</p>
                      <p className="diagnostic-message">{renderError}</p>
                    </article>
                  ) : undefined}
                </div>
              )}
            </section>
          </>
        ) : (
          <section className="preview-card preview-card-empty">
            <div className="preview-empty">
              <p className="preview-empty-eyebrow">Empty project</p>
              <h2>No previewable source files were found.</h2>
              <p>Add `src/**/*.tsx` files to one of the configured preview targets.</p>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
