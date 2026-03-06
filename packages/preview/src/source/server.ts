import path from "node:path";
import { createPreviewVitePlugin } from "./plugin";
import type { PreviewSourceTarget } from "./types";
import type { ReactPluginModule, ViteModule } from "./viteTypes";

const DEFAULT_PORT = 4174;

export type StartPreviewServerOptions = {
  packageName: string;
  packageRoot: string;
  port?: number;
  sourceRoot: string;
};

function resolveAppRoot() {
  return path.resolve(__dirname, "../../app");
}

export async function startPreviewServer(options: StartPreviewServerOptions) {
  const vite = (await import("vite")) as unknown as ViteModule;
  const reactPlugin = ((await import("@vitejs/plugin-react")) as unknown as ReactPluginModule).default;
  const appRoot = resolveAppRoot();
  const targets: PreviewSourceTarget[] = [
    {
      name: options.packageName,
      packageName: options.packageName,
      packageRoot: options.packageRoot,
      sourceRoot: options.sourceRoot,
    },
  ];
  const previewPlugin = createPreviewVitePlugin({
    projectName: options.packageName,
    targets,
  });
  const server = await vite.createServer({
    appType: "spa",
    configFile: false,
    plugins: [previewPlugin, reactPlugin()],
    root: appRoot,
    server: {
      fs: {
        allow: [
          appRoot,
          ...targets.flatMap((target) => [target.packageRoot, target.sourceRoot]),
          vite.searchForWorkspaceRoot(options.packageRoot),
        ],
      },
      open: false,
      port: options.port ?? DEFAULT_PORT,
    },
  });

  await server.listen();
  process.stdout.write(`Previewing ${options.packageName} from ${options.sourceRoot}\n`);
  server.printUrls();

  return server;
}
