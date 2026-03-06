import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "../../../packages/cli/src/cli";
import { parsePreviewArgs, resolvePreviewDevContext } from "../../../packages/cli/src/commands/preview";

const workspaceRoot = path.resolve(__dirname, "../../..");
const richHostsSourceRoot = path.resolve(__dirname, "../preview/fixtures/rich-hosts/src");
const unsupportedSourceRoot = path.resolve(__dirname, "../preview/fixtures/unsupported/src");

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

  it("parses repeated targets and app dir for legacy preview generation", () => {
    const args = parsePreviewArgs(
      [
        "generate",
        "--app-dir",
        "preview-app",
        "--target",
        "one=packages/checkbox/src",
        "--target=two=packages/switch/src",
      ],
      workspaceRoot,
    );

    expect(args).toMatchObject({
      appDir: path.resolve(workspaceRoot, "preview-app"),
      command: "generate",
      mode: "legacy",
    });
    expect(args.mode === "legacy" ? args.targets.map((target) => target.name) : []).toEqual(["one", "two"]);
  });

  it("rejects package roots without src for the source-first command", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lattice-preview-missing-src-"));
    fs.writeFileSync(path.join(tempRoot, "package.json"), JSON.stringify({ name: "@fixtures/missing-src" }, null, 2));

    expect(() => resolvePreviewDevContext(tempRoot)).toThrow("Preview source directory does not exist");
  });

  it("prints preview help", async () => {
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
    expect(output).toContain("init");
    expect(output).toContain("generate");
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

  it("scaffolds a preview app", async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lattice-preview-init-"));
    const appDir = path.join(tempRoot, "preview");

    await runCli(["preview", "init", "--app-dir", appDir, "--target", `rich-hosts=${richHostsSourceRoot}`]);

    expect(fs.existsSync(path.join(appDir, "package.json"))).toBe(true);
    expect(fs.existsSync(path.join(appDir, "src/scenes/rich-hosts.tsx"))).toBe(true);
    expect(fs.readFileSync(path.join(appDir, "package.json"), "utf8")).toContain(
      "lattice preview generate --app-dir .",
    );
    expect(fs.readFileSync(path.join(appDir, "package.json"), "utf8")).toContain("@lattice-ui/cli");
  });

  it("generates transformed modules into src/generated", async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lattice-preview-generate-"));
    const appDir = path.join(tempRoot, "preview");
    fs.mkdirSync(appDir, { recursive: true });

    await runCli(["preview", "generate", "--app-dir", appDir, "--target", `rich-hosts=${richHostsSourceRoot}`]);

    expect(fs.existsSync(path.join(appDir, "src/generated/rich-hosts/index.tsx"))).toBe(true);
  });

  it("loads @lattice-ui/preview from the built cli dist output", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lattice-preview-dist-generate-"));
    const appDir = path.join(tempRoot, "preview");
    fs.mkdirSync(appDir, { recursive: true });

    execFileSync("pnpm", ["--filter", "@lattice-ui/preview", "build"], {
      cwd: workspaceRoot,
      stdio: "pipe",
    });
    execFileSync("pnpm", ["--filter", "@lattice-ui/cli", "build"], {
      cwd: workspaceRoot,
      stdio: "pipe",
    });
    execFileSync(
      "node",
      [
        "packages/cli/dist/index.js",
        "preview",
        "generate",
        "--app-dir",
        appDir,
        "--target",
        `rich-hosts=${richHostsSourceRoot}`,
      ],
      {
        cwd: workspaceRoot,
        stdio: "pipe",
      },
    );

    expect(fs.existsSync(path.join(appDir, "src/generated/rich-hosts/index.tsx"))).toBe(true);
  });

  it("keeps the built @lattice-ui/preview root entry node-safe", () => {
    execFileSync("pnpm", ["--filter", "@lattice-ui/preview", "build"], {
      cwd: workspaceRoot,
      stdio: "pipe",
    });

    const output = execFileSync(
      "node",
      [
        "-e",
        "const mod=require('./packages/preview/dist/index.js'); console.log(JSON.stringify({ hasBuild: typeof mod.buildPreviewModules === 'function', hasServer: typeof mod.startPreviewServer === 'function', hasWorkspaceApp: 'PreviewWorkspaceApp' in mod }));",
      ],
      {
        cwd: workspaceRoot,
        stdio: "pipe",
      },
    )
      .toString()
      .trim();

    expect(JSON.parse(output)).toEqual({
      hasBuild: true,
      hasServer: true,
      hasWorkspaceApp: false,
    });
  });

  it("loads @lattice-ui/preview from the source cli tsx fallback", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lattice-preview-source-generate-"));
    const appDir = path.join(tempRoot, "preview");
    fs.mkdirSync(appDir, { recursive: true });

    execFileSync(
      "node",
      [
        "--import",
        "tsx",
        "./packages/cli/src/index.ts",
        "preview",
        "generate",
        "--app-dir",
        appDir,
        "--target",
        `rich-hosts=${richHostsSourceRoot}`,
      ],
      {
        cwd: workspaceRoot,
        stdio: "pipe",
      },
    );

    expect(fs.existsSync(path.join(appDir, "src/generated/rich-hosts/index.tsx"))).toBe(true);
  });

  it("rejects invalid target names", async () => {
    await expect(runCli(["preview", "generate", "--target", "BadName=packages/checkbox/src"])).rejects.toThrow(
      "Invalid preview target name",
    );
  });

  it("fails generation for unsupported globals with structured diagnostics", async () => {
    await expect(
      runCli(["preview", "generate", "--app-dir", "preview", "--target", `unsupported=${unsupportedSourceRoot}`]),
    ).rejects.toMatchObject({
      name: "PreviewBuildError",
    });
  });

  it("typechecks and builds apps/preview without preview generate", () => {
    execFileSync("pnpm", ["--dir", "apps/preview", "exec", "tsc", "-p", "tsconfig.json", "--noEmit"], {
      cwd: workspaceRoot,
      stdio: "pipe",
    });
    execFileSync("pnpm", ["--dir", "apps/preview", "exec", "vite", "build"], {
      cwd: workspaceRoot,
      stdio: "pipe",
    });
  });
});
