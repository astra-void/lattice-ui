import fs from "node:fs";
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

function resolvePreviewPackageEntry(candidates: string[], label: string) {
  const matchedPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!matchedPath) {
    throw new Error(`Unable to resolve ${label} entry.`);
  }

  return matchedPath;
}

function resolveShellRoot() {
  return resolvePreviewPackageEntry(
    [path.resolve(__dirname, "../shell"), path.resolve(__dirname, "../../src/shell")],
    "preview shell root",
  );
}

export async function startPreviewServer(options: StartPreviewServerOptions) {
  const vite = (await import("vite")) as unknown as ViteModule;
  const reactPlugin = ((await import("@vitejs/plugin-react")) as unknown as ReactPluginModule).default;
  const shellRoot = resolveShellRoot();
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
    root: shellRoot,
    server: {
      fs: {
        allow: [
          shellRoot,
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
