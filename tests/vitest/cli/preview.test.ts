import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "../../../packages/cli/src/cli";
import { parsePreviewArgs, resolvePreviewDevContext } from "../../../packages/cli/src/commands/preview";

const workspaceRoot = path.resolve(__dirname, "../../..");

function buildPreviewPackage() {
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

describe("preview command", () => {
  it("parses the source-first dev command from the current package root", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lattice-preview-dev-"));
    const packageRoot = path.join(tempRoot, "demo-package");
    fs.mkdirSync(path.join(packageRoot, "src"), { recursive: true });
    fs.writeFileSync(
      path.join(packageRoot, "package.json"),
      JSON.stringify({ name: "@fixtures/demo-package" }, null, 2),
    );

    const args = parsePreviewArgs([], packageRoot);

    expect(args).toMatchObject({
      mode: "dev",
      packageName: "@fixtures/demo-package",
      packageRoot,
      sourceRoot: path.join(packageRoot, "src"),
    });
  });

  it("rejects package roots without src for the source-first command", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lattice-preview-missing-src-"));
    fs.writeFileSync(path.join(tempRoot, "package.json"), JSON.stringify({ name: "@fixtures/missing-src" }, null, 2));

    expect(() => resolvePreviewDevContext(tempRoot)).toThrow("Preview source directory does not exist");
  });

  it("allows running source-first preview from the preview package and harness roots", () => {
    expect(resolvePreviewDevContext(path.join(workspaceRoot, "packages/preview"))).toMatchObject({
      packageName: "@lattice-ui/preview",
    });
    expect(resolvePreviewDevContext(path.join(workspaceRoot, "apps/preview-harness"))).toMatchObject({
      packageName: "@lattice-ui/preview-harness",
    });
  });

  it("rejects removed init and generate subcommands with migration guidance", () => {
    expect(() => parsePreviewArgs(["init"], workspaceRoot)).toThrow("Source-first preview replaced legacy scaffolding");
    expect(() => parsePreviewArgs(["generate"], workspaceRoot)).toThrow(
      "Source-first preview replaced legacy scaffolding",
    );
  });

  it("prints preview help without legacy subcommands", async () => {
    let output = "";
    const write = process.stdout.write.bind(process.stdout);
    const spy = (chunk: string | Uint8Array) => {
      output += chunk.toString();
      return true;
    };

    process.stdout.write = spy as typeof process.stdout.write;
    try {
      await runCli(["preview", "--help"]);
    } finally {
      process.stdout.write = write;
    }

    expect(output).toContain("lattice preview");
    expect(output).toContain("src/**/*.tsx");
    expect(output).toContain("only supported workflow");
    expect(output).not.toContain("init");
    expect(output).not.toContain("generate");
  });

  it("accepts a leading script separator token", async () => {
    let output = "";
    const write = process.stdout.write.bind(process.stdout);
    const spy = (chunk: string | Uint8Array) => {
      output += chunk.toString();
      return true;
    };

    process.stdout.write = spy as typeof process.stdout.write;
    try {
      await runCli(["--", "preview", "--help"]);
    } finally {
      process.stdout.write = write;
    }

    expect(output).toContain("lattice preview");
  });

  it("publishes an ESM-first preview root entry with only the server API", () => {
    buildPreviewPackage();

    const output = execFileSync(
      "node",
      [
        "--input-type=module",
        "-e",
        "const mod = await import('./packages/preview/dist/index.mjs'); console.log(JSON.stringify({ keys: Object.keys(mod).sort(), hasStart: typeof mod.startPreviewServer === 'function', hasDefaultStart: typeof mod.default?.startPreviewServer === 'function' }));",
      ],
      {
        cwd: workspaceRoot,
        stdio: "pipe",
      },
    )
      .toString()
      .trim();

    expect(JSON.parse(output)).toEqual({
      hasDefaultStart: true,
      hasStart: true,
      keys: ["default", "startPreviewServer"],
    });
  });

  it("builds the preview shell without bundling the preview-runtime CommonJS dist", () => {
    buildPreviewPackage();

    const bundle = readBuiltPreviewShellBundle();

    expect(bundle).not.toContain("../preview-runtime/dist/index.js");
    expect(bundle).not.toContain('Dynamic require of "react" is not supported');
  });

  it("drops public ui and build subpath exports from the preview package", () => {
    const packageJson = readPreviewPackageJson();

    expect(packageJson.exports).not.toHaveProperty("./ui");
    expect(packageJson.exports).not.toHaveProperty("./ui/styles.css");
    expect(packageJson.exports).not.toHaveProperty("./build");
  });

  it("publishes preview-runtime source files for browser-safe preview aliasing", () => {
    const packageJson = readPreviewRuntimePackageJson();

    expect(packageJson.files).toContain("src");
  });

  it("keeps the built cli dist on the removed-subcommand migration path", () => {
    buildPreviewPackage();
    buildCliPackage();

    const output = readCommandFailure(["node", "packages/cli/dist/index.js", "preview", "generate"], workspaceRoot);

    expect(output).toContain("Source-first preview replaced legacy scaffolding");
  });

  it("typechecks and builds the preview harness as a non-product smoke app", () => {
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
