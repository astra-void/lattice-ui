import fs from "node:fs";
import path from "node:path";
import { validationError } from "../core/errors";
import type { PreviewTargetSpec } from "./previewShared";

type PreviewAppFile = {
  relativePath: string;
  contents: string;
};

type CreatePreviewAppFilesOptions = {
  appDir: string;
  cliVersion: string;
  previewVersion: string;
  targets: PreviewTargetSpec[];
};

function toPascalCase(value: string) {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join("");
}

function toTitleCase(value: string) {
  return value
    .split(/[-_]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function quoteScriptArg(value: string) {
  return JSON.stringify(value);
}

function buildGenerateCommand(appDir: string, targets: PreviewTargetSpec[]) {
  const targetArgs = targets
    .map((target) => {
      const relativeSourceRoot = path.relative(appDir, target.sourceRoot) || ".";
      return `--target ${quoteScriptArg(`${target.name}=${relativeSourceRoot}`)}`;
    })
    .join(" ");

  return `lattice preview generate --app-dir . ${targetArgs}`;
}

function renderSceneFile(target: PreviewTargetSpec) {
  const sceneName = `${toPascalCase(target.name)}Scene`;
  const title = toTitleCase(target.name);

  return `import * as PreviewModule from "../generated/${target.name}";

const exportNames = Object.keys(PreviewModule).sort();

export function ${sceneName}() {
  return (
    <div className="scene-placeholder">
      <p className="scene-eyebrow">${title}</p>
      <h2>Preview scene stub</h2>
      <p>
        This file is intentionally minimal. Import the generated module and compose your own examples here.
      </p>
      <code className="scene-exports">{exportNames.length > 0 ? exportNames.join(", ") : "No exports detected yet."}</code>
    </div>
  );
}
`;
}

function renderScenesIndex(targets: PreviewTargetSpec[]) {
  const imports = targets
    .map((target) => {
      const sceneName = `${toPascalCase(target.name)}Scene`;
      return `import { ${sceneName} } from "./${target.name}";`;
    })
    .join("\n");

  const items = targets
    .map((target) => {
      const sceneName = `${toPascalCase(target.name)}Scene`;
      return `  { id: "${target.name}", title: "${toTitleCase(target.name)}", Component: ${sceneName} },`;
    })
    .join("\n");

  return `${imports}

export const scenes = [
${items}
] as const;
`;
}

function renderPackageJson(options: CreatePreviewAppFilesOptions) {
  const generateCommand = buildGenerateCommand(options.appDir, options.targets);

  return `${JSON.stringify(
    {
      name: "lattice-preview-app",
      private: true,
      version: "0.1.0",
      type: "module",
      scripts: {
        generate: generateCommand,
        dev: `${generateCommand} && vite`,
        build: `${generateCommand} && vite build`,
        typecheck: `${generateCommand} && tsc -p tsconfig.json --noEmit`,
      },
      dependencies: {
        "@lattice-ui/preview": options.previewVersion,
        react: "^19.0.0",
        "react-dom": "^19.0.0",
      },
      devDependencies: {
        "@lattice-ui/cli": options.cliVersion,
        "@types/react": "^19.0.10",
        "@types/react-dom": "^19.0.4",
        "@vitejs/plugin-react": "^5.0.4",
        typescript: "5.9.3",
        vite: "^7.3.1",
      },
    },
    null,
    2,
  )}
`;
}

export function createPreviewAppFiles(options: CreatePreviewAppFilesOptions): PreviewAppFile[] {
  return [
    {
      relativePath: "package.json",
      contents: renderPackageJson(options),
    },
    {
      relativePath: "index.html",
      contents: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>Lattice Preview</title>
  </head>
  <body>
    <div id="root"></div>
    <script src="/src/main.tsx" type="module"></script>
  </body>
</html>
`,
    },
    {
      relativePath: "tsconfig.json",
      contents: `{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "lib": ["ES2021", "DOM", "DOM.Iterable"],
    "types": ["vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "vite.config.ts"]
}
`,
    },
    {
      relativePath: "vite.config.ts",
      contents: `import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
});
`,
    },
    {
      relativePath: "src/main.tsx",
      contents: `import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Preview root element is missing.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`,
    },
    {
      relativePath: "src/App.tsx",
      contents: `import { scenes } from "./scenes";

export function App() {
  return (
    <main className="preview-shell">
      <section className="hero">
        <p className="eyebrow">Lattice Preview</p>
        <h1>Preview generated Roblox-first modules in a web shell.</h1>
        <p>
          Each scene imports its generated module from <code>src/generated</code>. Edit the scene files to build your
          own examples.
        </p>
      </section>

      <section className="scene-grid">
        {scenes.map((scene) => (
          <article className="scene-card" key={scene.id}>
            <header className="scene-header">
              <p className="scene-title">{scene.title}</p>
            </header>
            <scene.Component />
          </article>
        ))}
      </section>
    </main>
  );
}
`,
    },
    {
      relativePath: "src/styles.css",
      contents: `:root {
  --paper: #f7f0e8;
  --ink: #1d1f24;
  --muted: #5c6470;
  --panel: rgba(255, 255, 255, 0.82);
  --line: rgba(29, 31, 36, 0.1);
  --accent: #b94c2d;
  --shadow: 0 18px 48px rgba(41, 29, 20, 0.14);
  background:
    radial-gradient(circle at top left, rgba(185, 76, 45, 0.18), transparent 24rem),
    linear-gradient(180deg, #f5ede2 0%, #ebdfd1 100%);
  color: var(--ink);
  font-family: "IBM Plex Sans", "Avenir Next", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
}

code {
  font-family: "IBM Plex Mono", "SFMono-Regular", monospace;
}

.preview-shell {
  margin: 0 auto;
  max-width: 1200px;
  min-height: 100vh;
  padding: 48px 24px 72px;
}

.hero {
  margin-bottom: 28px;
  max-width: 56rem;
}

.hero h1 {
  font-family: "Instrument Serif", "Iowan Old Style", serif;
  font-size: clamp(3rem, 5vw, 5rem);
  font-weight: 500;
  letter-spacing: -0.04em;
  line-height: 0.95;
  margin: 0;
}

.hero p:last-child,
.scene-placeholder p {
  color: var(--muted);
  line-height: 1.6;
}

.eyebrow,
.scene-eyebrow,
.scene-title {
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  margin: 0 0 12px;
  text-transform: uppercase;
}

.scene-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.scene-card {
  backdrop-filter: blur(16px);
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 24px;
  box-shadow: var(--shadow);
  min-height: 260px;
  padding: 24px;
}

.scene-header {
  margin-bottom: 16px;
}

.scene-placeholder {
  display: grid;
  gap: 12px;
}

.scene-placeholder h2 {
  font-family: "Instrument Serif", "Iowan Old Style", serif;
  font-size: 2rem;
  font-weight: 500;
  letter-spacing: -0.04em;
  line-height: 1;
  margin: 0;
}

.scene-exports {
  background: rgba(29, 31, 36, 0.06);
  border-radius: 14px;
  display: block;
  padding: 12px;
  word-break: break-word;
}

.preview-host {
  font: inherit;
}

@media (max-width: 720px) {
  .preview-shell {
    padding: 32px 18px 56px;
  }
}
`,
    },
    {
      relativePath: "src/scenes/index.ts",
      contents: renderScenesIndex(options.targets),
    },
    ...options.targets.map((target) => ({
      relativePath: `src/scenes/${target.name}.tsx`,
      contents: renderSceneFile(target),
    })),
  ];
}

export function ensureAppDirectoryIsEmpty(appDir: string) {
  if (!fs.existsSync(appDir)) {
    return;
  }

  const entries = fs.readdirSync(appDir);
  if (entries.length > 0) {
    throw validationError(`Preview app directory must be empty: ${appDir}`);
  }
}

export function writePreviewAppFiles(appDir: string, files: PreviewAppFile[]) {
  fs.mkdirSync(appDir, { recursive: true });

  for (const file of files) {
    const destinationPath = path.join(appDir, file.relativePath);
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.writeFileSync(destinationPath, file.contents, "utf8");
  }
}
