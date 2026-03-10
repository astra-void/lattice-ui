import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runCli } from "../../../packages/cli/src/cli";
import { parsePreviewArgs, resolvePreviewDevContext } from "../../../packages/cli/src/commands/preview";

const workspaceRoot = path.resolve(__dirname, "../../..");
const tsxLoaderPath = path.join(workspaceRoot, "node_modules/tsx/dist/loader.mjs");
const temporaryRoots: string[] = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    fs.rmSync(root, { force: true, recursive: true });
  }
});

function buildPreviewPackage() {
  execFileSync("pnpm", ["--filter", "@lattice-ui/preview-runtime", "build"], {
    cwd: workspaceRoot,
    stdio: "pipe",
  });
  execFileSync("pnpm", ["--filter", "@lattice-ui/preview-engine", "build"], {
    cwd: workspaceRoot,
    stdio: "pipe",
  });
  execFileSync("pnpm", ["--filter", "@lattice-ui/preview", "build"], {
    cwd: workspaceRoot,
    stdio: "pipe",
  });
}

function buildCliPackage() {
  execFileSync("pnpm", ["--filter", "@lattice-ui/cli", "build"], {
    cwd: workspaceRoot,
    stdio: "pipe",
  });
}

function runSourceCli(args: string[], cwd: string) {
  return execFileSync(
    "node",
    ["--import", tsxLoaderPath, path.join(workspaceRoot, "packages/cli/src/index.ts"), ...args],
    {
      cwd,
      stdio: "pipe",
    },
  )
    .toString()
    .trim();
}

function readJsonFile<T>(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "")) as T;
}

function readPreviewPackageJson() {
  return readJsonFile<{
    exports?: Record<string, unknown>;
  }>(path.join(workspaceRoot, "packages/preview/package.json"));
}

function readPreviewRuntimePackageJson() {
  return readJsonFile<{
    files?: string[];
  }>(path.join(workspaceRoot, "packages/preview-runtime/package.json"));
}

function readBuiltPreviewShellBundle() {
  return fs.readFileSync(path.join(workspaceRoot, "packages/preview/dist/shell/main.js"), "utf8");
}

function readCommandFailure(command: string[], cwd: string) {
  try {
    execFileSync(command[0], command.slice(1), {
      cwd,
      stdio: "pipe",
    });
  } catch (error) {
    const failure = error as Error & {
      stderr?: Buffer;
      stdout?: Buffer;
    };
    return `${failure.stdout?.toString() ?? ""}${failure.stderr?.toString() ?? ""}`;
  }

  throw new Error(`Expected command to fail: ${command.join(" ")}`);
}

async function captureStdout(fn: () => Promise<void> | void) {
  let output = "";
  const write = process.stdout.write.bind(process.stdout);
  const spy = (chunk: string | Uint8Array) => {
    output += chunk.toString();
    return true;
  };

  process.stdout.write = spy as typeof process.stdout.write;
  try {
    await fn();
  } finally {
    process.stdout.write = write;
  }

  return output;
}

function createTempPackage(packageName = "@fixtures/demo-package") {
  const packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lattice-preview-package-"));
  temporaryRoots.push(packageRoot);
  fs.mkdirSync(path.join(packageRoot, "src"), { recursive: true });
  fs.writeFileSync(path.join(packageRoot, "package.json"), JSON.stringify({ name: packageName }, null, 2));
  fs.writeFileSync(
    path.join(packageRoot, "src", "Button.tsx"),
    `
      export function ButtonPreview() {
        return <frame />;
      }

      export const preview = {
        entry: ButtonPreview,
      };
    `,
    "utf8",
  );

  return packageRoot;
}

function createTempWorkspaceConfig() {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lattice-preview-workspace-"));
  temporaryRoots.push(workspaceRoot);

  const packageName = "@fixtures/workspace-button";
  const nestedPackageRoot = path.join(workspaceRoot, "packages", "button");
  fs.mkdirSync(path.join(nestedPackageRoot, "src"), { recursive: true });
  fs.writeFileSync(path.join(nestedPackageRoot, "package.json"), JSON.stringify({ name: packageName }, null, 2));
  fs.writeFileSync(
    path.join(nestedPackageRoot, "src", "Button.tsx"),
    `
      export function ButtonPreview() {
        return <frame />;
      }

      export const preview = {
        entry: ButtonPreview,
      };
    `,
    "utf8",
  );
  fs.writeFileSync(
    path.join(workspaceRoot, "lattice.preview.config.ts"),
    `
      export default {
        projectName: "Workspace Preview",
        targetDiscovery: {
          discoverTargets() {
            return [
              {
                name: "button",
                packageName: ${JSON.stringify(packageName)},
                packageRoot: "./packages/button",
                sourceRoot: "./packages/button/src",
              },
            ];
          },
        },
      };
    `,
    "utf8",
  );

  return {
    nestedPackageRoot,
    workspaceRoot,
  };
}

describe("preview command", () => {
  it("parses config and headless flags for the preview command", () => {
    expect(parsePreviewArgs([])).toEqual({
      configFile: undefined,
      headless: false,
      mode: "run",
    });

    expect(parsePreviewArgs(["--config", "./lattice.preview.config.ts", "--headless"])).toEqual({
      configFile: "./lattice.preview.config.ts",
      headless: true,
      mode: "run",
    });

    expect(parsePreviewArgs(["--config=./lattice.preview.config.ts"])).toEqual({
      configFile: "./lattice.preview.config.ts",
      headless: false,
      mode: "run",
    });
  });

  it("rejects package roots without src for the zero-config command", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lattice-preview-missing-src-"));
    temporaryRoots.push(tempRoot);
    fs.writeFileSync(path.join(tempRoot, "package.json"), JSON.stringify({ name: "@fixtures/missing-src" }, null, 2));

    expect(() => resolvePreviewDevContext(tempRoot)).toThrow("Preview source directory does not exist");
  });

  it("allows zero-config preview from package roots", () => {
    const packageRoot = createTempPackage();

    expect(resolvePreviewDevContext(packageRoot)).toMatchObject({
      packageName: "@fixtures/demo-package",
      packageRoot,
      sourceRoot: path.join(packageRoot, "src"),
      transformMode: "strict-fidelity",
    });
  });

  it("rejects removed init and generate subcommands with migration guidance", () => {
    expect(() => parsePreviewArgs(["init"])).toThrow("Source-first preview replaced legacy scaffolding");
    expect(() => parsePreviewArgs(["generate"])).toThrow("Source-first preview replaced legacy scaffolding");
  });

  it("prints preview help with config and headless workflows", async () => {
    const output = await captureStdout(async () => {
      await runCli(["preview", "--help"]);
    });

    expect(output).toContain("lattice preview");
    expect(output).toContain("--config <path>");
    expect(output).toContain("--headless");
    expect(output).toContain("lattice.preview.config.ts");
    expect(output).not.toContain("preview init");
    expect(output).not.toContain("preview generate");
  });

  it("accepts a leading script separator token", async () => {
    const output = await captureStdout(async () => {
      await runCli(["--", "preview", "--help"]);
    });

    expect(output).toContain("lattice preview");
  });

  it("prints a headless preview snapshot for zero-config package roots", () => {
    const packageRoot = createTempPackage();

    const output = runSourceCli(["preview", "--headless"], packageRoot);
    const snapshot = JSON.parse(output) as {
      entries: Record<string, { descriptor: { status: string } }>;
      protocolVersion: number;
      workspaceIndex: {
        entries: Array<{ relativePath: string; selection: { kind: string } }>;
        projectName: string;
      };
    };

    expect(snapshot.protocolVersion).toBeTypeOf("number");
    expect(snapshot.workspaceIndex.projectName).toBe("@fixtures/demo-package");
    expect(snapshot.workspaceIndex.entries).toEqual([
      expect.objectContaining({
        relativePath: "Button.tsx",
        selection: expect.objectContaining({
          kind: "explicit",
        }),
      }),
    ]);
    expect(Object.values(snapshot.entries)).toEqual([
      expect.objectContaining({
        descriptor: expect.objectContaining({
          status: "ready",
        }),
      }),
    ]);
  });

  it("prints a headless preview snapshot from an explicit config file", () => {
    const { nestedPackageRoot, workspaceRoot: tempWorkspaceRoot } = createTempWorkspaceConfig();

    const output = runSourceCli(
      [
        "preview",
        "--config",
        path.join(tempWorkspaceRoot, "lattice.preview.config.ts"),
        "--headless",
      ],
      nestedPackageRoot,
    );
    const snapshot = JSON.parse(output) as {
      workspaceIndex: {
        entries: Array<{ relativePath: string }>;
        projectName: string;
      };
    };

    expect(snapshot.workspaceIndex.projectName).toBe("Workspace Preview");
    expect(snapshot.workspaceIndex.entries).toEqual([expect.objectContaining({ relativePath: "Button.tsx" })]);
  });

  it("publishes the public preview bootstrap APIs from the root entry", async () => {
    const previewModule = await import("../../../packages/preview/src/index");

    expect(Object.keys(previewModule).sort()).toEqual([
      "buildPreviewModules",
      "createPackageTargetDiscovery",
      "createPreviewHeadlessSession",
      "createStaticTargetsDiscovery",
      "createWorkspaceTargetsDiscovery",
      "definePreviewConfig",
      "loadPreviewConfig",
      "resolvePreviewConfigObject",
      "startPreviewServer",
    ]);
  });

  it("builds the preview shell without bundling the preview-runtime CommonJS dist", { timeout: 20000 }, () => {
    buildPreviewPackage();

    const bundle = readBuiltPreviewShellBundle();

    expect(bundle).not.toContain("../preview-runtime/dist/index.js");
    expect(bundle).not.toContain('Dynamic require of "react" is not supported');
  });

  it("keeps a single ESM root export for the preview package", () => {
    const packageJson = readPreviewPackageJson();

    expect(packageJson.exports).toEqual({
      ".": {
        default: "./dist/index.mjs",
        import: "./dist/index.mjs",
        types: "./dist/index.d.ts",
      },
    });
  });

  it("publishes preview-runtime source files for browser-safe preview aliasing", () => {
    const packageJson = readPreviewRuntimePackageJson();

    expect(packageJson.files).toContain("src");
  });

  it("keeps the built cli dist on the removed-subcommand migration path", () => {
    const output = readCommandFailure(
      [
        "node",
        "--import",
        tsxLoaderPath,
        path.join(workspaceRoot, "packages/cli/src/index.ts"),
        "preview",
        "generate",
      ],
      workspaceRoot,
    );

    expect(output).toContain("Source-first preview replaced legacy scaffolding");
  });

  it("typechecks and builds the preview harness as a config-driven smoke app", () => {
    execFileSync("pnpm", ["--dir", "apps/preview-harness", "exec", "tsc", "-p", "tsconfig.json", "--noEmit"], {
      cwd: workspaceRoot,
      stdio: "pipe",
    });
    execFileSync("pnpm", ["--dir", "apps/preview-harness", "exec", "vite", "build"], {
      cwd: workspaceRoot,
      stdio: "pipe",
    });
  }, 20_000);
});
