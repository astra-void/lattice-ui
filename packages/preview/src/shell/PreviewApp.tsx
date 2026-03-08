import React from "react";
import { LayoutProvider } from "../runtime/LayoutProvider";
import {
  areViewportsEqual,
  createWindowViewport,
  isViewportLargeEnough,
  measureElementViewport,
  pickViewport,
  type ViewportSize,
} from "../runtime/viewport";
import type { PreviewDefinition, PreviewRegistryItem } from "../source/types";

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

function readModuleExport(module: PreviewModule, exportName: "default" | string) {
  if (exportName === "default") {
    return module.default;
  }

  if (exportName in module) {
    return module[exportName];
  }

  if (module.default && typeof module.default === "object" && exportName in module.default) {
    return (module.default as Record<string, unknown>)[exportName];
  }

  return undefined;
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
    if (typeof exportValue !== "function") {
      throw new Error(`Expected \`${entry.render.exportName}\` to be a component export.`);
    }

    const props =
      entry.render.usesPreviewProps && preview?.props && typeof preview.props === "object" ? preview.props : undefined;

    return React.createElement(exportValue as React.ComponentType<Record<string, unknown>>, props);
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

    const update = () => {
      const measuredViewport = measureElementViewport(element);
      const nextViewport = pickViewport([measuredViewport, lastStableViewportRef.current], createWindowViewport());

      if (isViewportLargeEnough(nextViewport)) {
        lastStableViewportRef.current = nextViewport;
      }

      setViewport((previous) => (areViewportsEqual(previous, nextViewport) ? previous : nextViewport));
    };

    update();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        update();
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
              <span className={`status-pill status-${entry.status}`}>{entry.status}</span>
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
                <div className="header-meta">
                  <span>{selectedEntry.targetName}</span>
                  <span>{selectedEntry.relativePath}</span>
                  <span>{selectedEntry.hasPreviewExport ? "Has preview export" : "Direct export render"}</span>
                </div>
                <label className="debug-toggle">
                  <input
                    checked={isDebugMode}
                    onChange={(event) => setIsDebugMode(event.target.checked)}
                    type="checkbox"
                  />
                  <span>Debug mode</span>
                </label>
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
              ) : selectedEntry.status === "needs-harness" ? (
                <div className="preview-empty">
                  <p className="preview-empty-eyebrow">Needs harness</p>
                  <h2>This file is not directly previewable yet.</h2>
                  <p>
                    Add a default export or <code>export const preview = {`{ render: ... }`}</code> when the file needs
                    explicit disambiguation.
                  </p>
                </div>
              ) : (
                <div className="preview-empty">
                  <p className="preview-empty-eyebrow">Diagnostics</p>
                  <h2>Transform diagnostics are blocking this preview.</h2>
                  <p>Fix the unsupported patterns below, then save again.</p>
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
                  <span>{selectedEntry.diagnostics.length} static issue(s)</span>
                  {renderError ? <span>render error</span> : undefined}
                  {loadError ? <span>load error</span> : undefined}
                </div>
              </div>
              {selectedEntry.diagnostics.length === 0 && !renderError && !loadError ? (
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
