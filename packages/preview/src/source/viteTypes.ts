export type PreviewModuleNode = object;

export type PreviewModuleGraph = {
  getModuleById(id: string): PreviewModuleNode | undefined;
  invalidateModule(moduleNode: PreviewModuleNode): void;
};

export type PreviewWatcher = {
  on(event: "add" | "unlink", listener: (filePath: string) => void): void;
};

export type PreviewWebSocket = {
  send(payload: { type: "full-reload" }): void;
};

export type PreviewDevServer = {
  listen(): Promise<void>;
  moduleGraph: PreviewModuleGraph;
  printUrls(): void;
  watcher: PreviewWatcher;
  ws: PreviewWebSocket;
};

export type PreviewPlugin = {
  configureServer(server: PreviewDevServer): void;
  enforce: "pre";
  handleHotUpdate(context: { file: string }): void;
  load(id: string): string | undefined;
  name: string;
  resolveId(id: string): string | undefined;
  transform(code: string, id: string): { code: string; map: null } | undefined;
};

export type PreviewServerConfig = {
  appType: "spa";
  configFile: false;
  plugins: unknown[];
  root: string;
  server: {
    fs: {
      allow: string[];
    };
    open: false;
    port: number;
  };
};

export type ViteModule = {
  createServer(config: PreviewServerConfig): Promise<PreviewDevServer>;
  searchForWorkspaceRoot(searchPath: string): string;
};

export type ReactPluginModule = {
  default: () => unknown;
};
