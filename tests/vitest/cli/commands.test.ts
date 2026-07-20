import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runAddCommand } from "../../../packages/tools/cli/src/commands/add";
import { runCreateCommand } from "../../../packages/tools/cli/src/commands/create";
import { runDoctorCommand } from "../../../packages/tools/cli/src/commands/doctor";
import { runInitCommand } from "../../../packages/tools/cli/src/commands/init";
import { runRemoveCommand } from "../../../packages/tools/cli/src/commands/remove";
import { runUpgradeCommand } from "../../../packages/tools/cli/src/commands/upgrade";
import type { Logger } from "../../../packages/tools/cli/src/core/logger";
import { detectPackageManager } from "../../../packages/tools/cli/src/core/pm/detect";
import type { PackageManager } from "../../../packages/tools/cli/src/core/pm/types";
import * as promptModule from "../../../packages/tools/cli/src/core/prompt";
import type { Registry } from "../../../packages/tools/cli/src/core/registry/schema";
import type { CliContext } from "../../../packages/tools/cli/src/ctx";

const tempDirs: string[] = [];

async function createTempDir() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "lattice-cli-command-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

function createLogger(overrides?: Partial<Logger>): Logger {
  return {
    verbose: false,
    header: vi.fn(),
    fields: vi.fn(),
    group: vi.fn(),
    command: vi.fn(),
    outcome: vi.fn(),
    next: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    confirm: vi.fn(async () => true),
    spinner: vi.fn(() => ({
      succeed: vi.fn(),
      fail: vi.fn(),
      stop: vi.fn(),
    })),
    ...overrides,
  };
}

/** Flattens every `fields([...])` call into `label` → `value` for assertions. */
function fieldsOf(logger: Logger): Record<string, string> {
  const calls = (logger.fields as unknown as { mock: { calls: [[string, string][]][] } }).mock.calls;
  return Object.fromEntries(calls.flatMap(([entries]) => entries));
}

/** Every `group()` call as `title` → rows, with two-column rows joined. */
function groupsOf(logger: Logger): Record<string, string[]> {
  const calls = (logger.group as unknown as { mock: { calls: [string, (string | [string, string])[]][] } }).mock.calls;
  return Object.fromEntries(
    calls.map(([title, items]) => [title, items.map((item) => (Array.isArray(item) ? item.join(" ") : item))]),
  );
}

function commandsOf(logger: Logger): string[] {
  return (logger.command as unknown as { mock: { calls: [string][] } }).mock.calls.map(([line]) => line);
}

function nextOf(logger: Logger): string[] {
  return (logger.next as unknown as { mock: { calls: [string[]][] } }).mock.calls.flatMap(([entries]) => entries);
}

function outcomesOf(logger: Logger): string[] {
  return (logger.outcome as unknown as { mock: { calls: [string, string?][] } }).mock.calls.map(([message]) => message);
}

function createPackageManager(overrides?: Partial<PackageManager>): PackageManager {
  return {
    name: "npm",
    add: vi.fn(async () => undefined),
    remove: vi.fn(async () => undefined),
    install: vi.fn(async () => undefined),
    exec: vi.fn(async () => undefined),
    ...overrides,
  };
}

function createResolvedVersions(version = "1.0.0") {
  return vi.fn(async (packages: string[]) => Object.fromEntries(packages.map((packageName) => [packageName, version])));
}

function createContext(params: {
  projectRoot: string;
  registry: Registry;
  options?: Partial<CliContext["options"]>;
  pm?: Partial<PackageManager>;
  logger?: Logger;
  detectedLockfiles?: CliContext["detectedLockfiles"];
  pins?: CliContext["pins"];
}): CliContext {
  const pm = createPackageManager(params.pm);

  return {
    cwd: params.projectRoot,
    projectRoot: params.projectRoot,
    packageJsonPath: path.join(params.projectRoot, "package.json"),
    options: {
      cwd: params.projectRoot,
      pm: undefined,
      dryRun: false,
      yes: true,
      verbose: false,
      ...params.options,
    },
    logger: params.logger ?? createLogger(),
    pm,
    pmName: pm.name,
    detectedLockfiles: params.detectedLockfiles ?? ["npm"],
    installedPackageManagers: [pm.name],
    pmResolutionSource: (params.detectedLockfiles ?? ["npm"]).length > 0 ? "lockfile" : "installed",
    pins: params.pins ?? [],
    registry: params.registry,
  };
}

describe("command behavior", () => {
  it("create scaffolds a new project and installs dependencies", async () => {
    const dir = await createTempDir();
    const projectRoot = path.join(dir, "my-game");
    const install = vi.fn(async () => undefined);

    await runCreateCommand(
      {
        cwd: dir,
        projectPath: "my-game",
        yes: true,
        pm: "npm",
        template: "rbxts",
        git: false,
      },
      {
        detectPackageManagerFn: vi.fn(async (cwd: string) => ({
          name: "npm" as const,
          manager: createPackageManager({ install }),
          lockfiles: [],
          installed: ["npm"],
          source: "override" as const,
          pins: [],
        })),
        resolveLatestVersionsFn: vi.fn(async (packages) =>
          Object.fromEntries(packages.map((packageName: string) => [packageName, "9.9.9"])),
        ),
      },
    );

    const packageJsonRaw = await readFile(path.join(projectRoot, "package.json"), "utf8");
    const packageJson = JSON.parse(packageJsonRaw) as {
      version: string;
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    const defaultProject = JSON.parse(await readFile(path.join(projectRoot, "default.project.json"), "utf8")) as {
      globIgnorePaths: string[];
      tree: {
        ServerScriptService: Record<string, unknown>;
        ReplicatedStorage: Record<string, unknown>;
        StarterPlayer: Record<string, unknown>;
        Workspace: Record<string, unknown>;
        HttpService: Record<string, unknown>;
        SoundService: Record<string, unknown>;
      };
    };
    const tsconfig = JSON.parse(await readFile(path.join(projectRoot, "tsconfig.json"), "utf8")) as {
      compilerOptions: {
        target: string;
      };
      include: string[];
      rbxts?: unknown;
    };
    const mainClient = await readFile(path.join(projectRoot, "src", "client", "main.client.tsx"), "utf8");

    expect(packageJson.version).toBe("0.1.0");
    expect(packageJson.dependencies["@rbxts/react"]).toBe("9.9.9");
    expect(packageJson.dependencies["@rbxts/react-roblox"]).toBe("9.9.9");
    expect(packageJson.dependencies["@lattice-ui/react-style"]).toBe("9.9.9");
    expect(packageJson.devDependencies["lattice-ui"]).toBe("9.9.9");
    expect(packageJson.devDependencies["@eslint/eslintrc"]).toBe("9.9.9");
    expect(packageJson.devDependencies["eslint"]).toBe("9.9.9");
    expect(packageJson.devDependencies["eslint-plugin-roblox-ts"]).toBe("9.9.9");
    expect(packageJson.devDependencies["prettier"]).toBe("9.9.9");
    expect(packageJson.devDependencies["roblox-ts"]).toBe("9.9.9");
    expect(packageJson.scripts.lint).toBe("eslint .");
    expect(packageJson.scripts["format:check"]).toBe("prettier . --check");
    expect(defaultProject.globIgnorePaths).toEqual(["**/package.json", "**/tsconfig.json"]);
    expect(defaultProject.tree.ServerScriptService).toHaveProperty("TS.$path", "out/server");
    expect(defaultProject.tree.ReplicatedStorage).toHaveProperty("rbxts_include.$path", "include");
    expect(defaultProject.tree.ReplicatedStorage).toHaveProperty(
      "rbxts_include.node_modules.@rbxts.$path",
      "node_modules/@rbxts",
    );
    expect(defaultProject.tree.ReplicatedStorage).toHaveProperty(
      "node_modules.@lattice-ui.$path",
      "node_modules/@lattice-ui",
    );
    expect(defaultProject.tree.ReplicatedStorage).toHaveProperty("node_modules.@rbxts.$path", "node_modules/@rbxts");
    expect(defaultProject.tree.ReplicatedStorage).toHaveProperty(
      "node_modules.@rbxts-js.$path",
      "node_modules/@rbxts-js",
    );
    expect(defaultProject.tree.ReplicatedStorage).toHaveProperty("TS.$path", "out/shared");
    expect(defaultProject.tree.StarterPlayer).toHaveProperty("StarterPlayerScripts.TS.$path", "out/client");
    expect(defaultProject.tree.Workspace).toHaveProperty("$properties.FilteringEnabled", true);
    expect(defaultProject.tree.HttpService).toHaveProperty("$properties.HttpEnabled", true);
    expect(defaultProject.tree.SoundService).toHaveProperty("$properties.RespectFilteringEnabled", true);
    expect(tsconfig.compilerOptions.target).toBe("esnext");
    expect(tsconfig.include).toEqual(["src"]);
    expect(tsconfig.rbxts).toBeUndefined();
    expect(mainClient).toContain('import { defaultLightTheme, ThemeProvider } from "@lattice-ui/react-style";');
    expect(mainClient).toContain("<ThemeProvider theme={defaultLightTheme}>");
    expect(packageJsonRaw.indexOf('"name"')).toBeLessThan(packageJsonRaw.indexOf('"version"'));
    expect(packageJsonRaw.indexOf('"version"')).toBeLessThan(packageJsonRaw.indexOf('"private"'));
    expect(packageJsonRaw.indexOf('"private"')).toBeLessThan(packageJsonRaw.indexOf('"scripts"'));
    expect(packageJsonRaw.indexOf('"scripts"')).toBeLessThan(packageJsonRaw.indexOf('"dependencies"'));
    expect(packageJsonRaw.indexOf('"dependencies"')).toBeLessThan(packageJsonRaw.indexOf('"devDependencies"'));
    expect(install).toHaveBeenCalledWith(projectRoot);
    await expect(readFile(path.join(projectRoot, "eslint.config.mjs"), "utf8")).resolves.toContain(
      "@typescript-eslint/parser",
    );
    await expect(readFile(path.join(projectRoot, ".prettierrc"), "utf8")).resolves.toContain('"printWidth": 120');
    const gitignore = await readFile(path.join(projectRoot, ".gitignore"), "utf8");
    expect(gitignore).toContain("node_modules");
    expect(gitignore).toContain("out");
    expect(gitignore).toContain("include");
    expect(gitignore).toContain("*.rbxlx");
    expect(gitignore).toContain("*.tsbuildinfo");
    await expect(access(path.join(projectRoot, "include"))).resolves.toBeUndefined();
    await expect(access(path.join(projectRoot, "out", "shared"))).resolves.toBeUndefined();
    await expect(access(path.join(projectRoot, "out", "server"))).resolves.toBeUndefined();
    await expect(access(path.join(projectRoot, "out", "client"))).resolves.toBeUndefined();
  });

  it("create resolves project path from interactive prompt when omitted", async () => {
    const dir = await createTempDir();
    const install = vi.fn(async () => undefined);

    await runCreateCommand(
      {
        cwd: dir,
        yes: false,
        pm: "npm",
        template: "rbxts",
        git: false,
        lint: true,
      },
      {
        promptInputFn: vi.fn(async () => "my-interactive-game"),
        detectPackageManagerFn: vi.fn(async (cwd: string) => ({
          name: "npm" as const,
          manager: createPackageManager({ install }),
          lockfiles: [],
          installed: ["npm"],
          source: "override" as const,
          pins: [],
        })),
        resolveLatestVersionsFn: vi.fn(async (packages) =>
          Object.fromEntries(packages.map((packageName: string) => [packageName, "1.0.0"])),
        ),
      },
    );

    const packageJsonPath = path.join(dir, "my-interactive-game", "package.json");
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as { name: string };
    expect(packageJson.name).toBe("my-interactive-game");
    expect(install).toHaveBeenCalledWith(path.join(dir, "my-interactive-game"));
  });

  it("create writes pnpm hoisted linker config", async () => {
    const dir = await createTempDir();
    const projectRoot = path.join(dir, "my-game");

    await runCreateCommand(
      {
        cwd: dir,
        projectPath: "my-game",
        yes: true,
        pm: "pnpm",
        template: "rbxts",
        git: false,
        lint: false,
      },
      {
        detectPackageManagerFn: vi.fn(async () => ({
          name: "pnpm" as const,
          manager: createPackageManager({ name: "pnpm" }),
          lockfiles: [],
          installed: ["pnpm"],
          source: "override" as const,
          pins: [],
        })),
        resolveLatestVersionsFn: vi.fn(async (packages) =>
          Object.fromEntries(packages.map((packageName: string) => [packageName, "1.0.0"])),
        ),
      },
    );

    const defaultProject = JSON.parse(await readFile(path.join(projectRoot, "default.project.json"), "utf8")) as {
      tree: {
        ReplicatedStorage: Record<string, unknown>;
      };
    };
    const npmrc = await readFile(path.join(projectRoot, ".npmrc"), "utf8");

    expect(defaultProject.tree.ReplicatedStorage).toHaveProperty(
      "node_modules.@rbxts-js.$path",
      "node_modules/@rbxts-js",
    );
    expect(npmrc).toBe("node-linker=hoisted\n");
  });

  it("create requires project path in --yes mode", async () => {
    const dir = await createTempDir();

    await expect(
      runCreateCommand({
        cwd: dir,
        yes: true,
        pm: "npm",
        template: "rbxts",
        git: false,
      }),
    ).rejects.toThrow(/requires \[project-path\] when using --yes/i);
  });

  it("create fails when target directory is not empty", async () => {
    const dir = await createTempDir();
    const projectRoot = path.join(dir, "existing-game");
    await mkdir(projectRoot, { recursive: true });
    await writeFile(path.join(projectRoot, "seed.txt"), "seed", "utf8");

    await expect(
      runCreateCommand({
        cwd: dir,
        projectPath: "existing-game",
        yes: true,
        pm: "npm",
        template: "rbxts",
        git: false,
      }),
    ).rejects.toThrow(/must be empty/i);
  });

  it("create fails when latest version resolution fails", async () => {
    const dir = await createTempDir();

    await expect(
      runCreateCommand(
        {
          cwd: dir,
          projectPath: "my-game",
          yes: true,
          pm: "npm",
          template: "rbxts",
          git: false,
        },
        {
          detectPackageManagerFn: vi.fn(async (cwd: string) => ({
            name: "npm" as const,
            manager: createPackageManager(),
            lockfiles: [],
            installed: ["npm"],
            source: "override" as const,
            pins: [],
          })),
          resolveLatestVersionsFn: vi.fn(async () => {
            throw new Error("registry unavailable");
          }),
        },
      ),
    ).rejects.toThrow(/registry unavailable/i);

    await expect(access(path.join(dir, "my-game"))).rejects.toThrow();
  });

  it("create leaves no directory behind when package manager detection fails", async () => {
    const dir = await createTempDir();

    await expect(
      runCreateCommand(
        {
          cwd: dir,
          projectPath: "my-game",
          yes: true,
          pm: "bogus",
          template: "rbxts",
          git: false,
        },
        {
          detectPackageManagerFn: vi.fn(async () => {
            throw new Error('Invalid --pm value "bogus". Use pnpm, npm, or yarn.');
          }),
          resolveLatestVersionsFn: vi.fn(async (packages) =>
            Object.fromEntries(packages.map((packageName: string) => [packageName, "9.9.9"])),
          ),
        },
      ),
    ).rejects.toThrow(/invalid --pm value/i);

    await expect(access(path.join(dir, "my-game"))).rejects.toThrow();
  });

  it("create pins the scaffolded project at the package manager that installed it", async () => {
    const dir = await createTempDir();
    const projectRoot = path.join(dir, "pinned-game");
    const install = vi.fn(async () => undefined);

    await runCreateCommand(
      {
        cwd: dir,
        projectPath: "pinned-game",
        yes: true,
        pm: "pnpm",
        template: "rbxts",
        git: false,
        lint: false,
      },
      {
        detectPackageManagerFn: vi.fn(async () => ({
          name: "pnpm" as const,
          manager: createPackageManager({ name: "pnpm", install }),
          lockfiles: [],
          installed: ["pnpm" as const],
          source: "override" as const,
          pins: [],
        })),
        resolveLatestVersionsFn: vi.fn(async (packages) =>
          Object.fromEntries(packages.map((packageName: string) => [packageName, "9.9.9"])),
        ),
      },
    );

    const packageJson = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8")) as {
      devEngines?: { packageManager?: { name?: string; version?: string } };
    };

    expect(packageJson.devEngines?.packageManager?.name).toBe("pnpm");
    // The range belongs to the manager it was written for, so the pin stays version-less.
    expect(packageJson.devEngines?.packageManager?.version).toBeUndefined();
    // The pin has to land before install, or the first install runs unpinned.
    expect(install).toHaveBeenCalledTimes(1);
  });

  it("create skips lint setup when lint is disabled", async () => {
    const dir = await createTempDir();
    const projectRoot = path.join(dir, "my-game");

    await runCreateCommand(
      {
        cwd: dir,
        projectPath: "my-game",
        yes: true,
        pm: "npm",
        template: "rbxts",
        git: false,
        lint: false,
      },
      {
        detectPackageManagerFn: vi.fn(async (cwd: string) => ({
          name: "npm" as const,
          manager: createPackageManager(),
          lockfiles: [],
          installed: ["npm"],
          source: "override" as const,
          pins: [],
        })),
        resolveLatestVersionsFn: vi.fn(async (packages) =>
          Object.fromEntries(packages.map((packageName: string) => [packageName, "1.0.0"])),
        ),
      },
    );

    const packageJson = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(packageJson.devDependencies["lattice-ui"]).toBe("1.0.0");
    expect(packageJson.devDependencies["@eslint/eslintrc"]).toBeUndefined();
    expect(packageJson.devDependencies["eslint"]).toBeUndefined();
    expect(packageJson.devDependencies["prettier"]).toBeUndefined();
    expect(packageJson.scripts.lint).toBeUndefined();
    await expect(readFile(path.join(projectRoot, "eslint.config.mjs"), "utf8")).rejects.toThrow();
    await expect(readFile(path.join(projectRoot, ".prettierrc"), "utf8")).rejects.toThrow();
  });

  it("create with --git initializes repository and keeps .gitignore", async () => {
    const dir = await createTempDir();
    const projectRoot = path.join(dir, "my-game");
    const runProcess = vi.fn(async () => undefined);

    await runCreateCommand(
      {
        cwd: dir,
        projectPath: "my-game",
        yes: true,
        pm: "npm",
        template: "rbxts",
        git: true,
      },
      {
        detectPackageManagerFn: vi.fn(async () => ({
          name: "npm" as const,
          manager: createPackageManager(),
          lockfiles: [],
          installed: ["npm"],
          source: "override" as const,
          pins: [],
        })),
        resolveLatestVersionsFn: vi.fn(async (packages) =>
          Object.fromEntries(packages.map((packageName: string) => [packageName, "1.0.0"])),
        ),
        runProcessFn: runProcess,
      },
    );

    expect(runProcess).toHaveBeenCalledWith("git", ["init"], projectRoot);
    const gitignore = await readFile(path.join(projectRoot, ".gitignore"), "utf8");
    expect(gitignore).toContain("node_modules");
    expect(gitignore).toContain("out");
  });

  it("create emits structured output sections", async () => {
    const dir = await createTempDir();
    const logger = createLogger();

    await runCreateCommand(
      {
        cwd: dir,
        projectPath: "my-game",
        yes: true,
        pm: "npm",
        template: "rbxts",
        git: false,
      },
      {
        createLoggerFn: () => logger,
        detectPackageManagerFn: vi.fn(async (cwd: string) => ({
          name: "npm" as const,
          manager: createPackageManager(),
          lockfiles: [],
          installed: ["npm"],
          source: "override" as const,
          pins: [],
        })),
        resolveLatestVersionsFn: vi.fn(async (packages) =>
          Object.fromEntries(packages.map((packageName: string) => [packageName, "1.0.0"])),
        ),
      },
    );

    expect(logger.header).toHaveBeenCalledWith("lattice create");
    expect(fieldsOf(logger)).toMatchObject({ Template: "rbxts", Manager: "npm · --pm" });
    expect(outcomesOf(logger)[0]).toMatch(/^Created /);
    expect(nextOf(logger)).toContain("npx lattice-ui add --preset form");
  });

  it("create auto-selects the only installed package manager without prompting", async () => {
    const dir = await createTempDir();
    const projectRoot = path.join(dir, "single-pm");
    const install = vi.fn(async () => undefined);
    const promptSelectFn = vi.fn(async () => "yarn");

    await runCreateCommand(
      {
        cwd: dir,
        projectPath: "single-pm",
        yes: false,
        template: "rbxts",
        git: false,
        lint: false,
      },
      {
        promptSelectFn,
        detectPackageManagerFn: async (cwd, override, options) => {
          const result = await detectPackageManager(cwd, override, {
            ...options,
            runtime: {
              ...options?.runtime,
              yes: options?.runtime?.yes ?? false,
              stdin: { isTTY: true } as NodeJS.ReadStream,
              stdout: { isTTY: true } as NodeJS.WriteStream,
            },
            detectInstalledPackageManagersFn: async () => ["pnpm"],
          });

          return {
            ...result,
            manager: createPackageManager({ name: result.name, install }),
          };
        },
        resolveLatestVersionsFn: createResolvedVersions(),
      },
    );

    expect(promptSelectFn).not.toHaveBeenCalled();
    expect(install).toHaveBeenCalledWith(projectRoot);
  });

  it("init pins typescript instead of resolving it from the registry", async () => {
    const dir = await createTempDir();
    await writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "tmp" }, null, 2), "utf8");

    const resolveLatestVersionsFn = createResolvedVersions("9.9.9");

    await runInitCommand(
      {
        cwd: dir,
        pm: "npm",
        yes: true,
        dryRun: false,
        lint: true,
      },
      {
        detectPackageManagerFn: vi.fn(async () => ({
          name: "npm" as const,
          manager: createPackageManager(),
          lockfiles: [],
          installed: ["npm" as const],
          source: "override" as const,
          pins: [],
        })),
        resolveLatestVersionsFn,
      },
    );

    const manifest = JSON.parse(await readFile(path.join(dir, "package.json"), "utf8"));

    expect(manifest.devDependencies.typescript).toBe("5.5.3");
    expect(resolveLatestVersionsFn.mock.calls[0][0]).not.toContain("typescript");
  });

  it("init replaces renamed lattice packages with their current names", async () => {
    const dir = await createTempDir();
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify(
        {
          name: "tmp",
          dependencies: {
            "@lattice-ui/style": "0.6.0",
            "@lattice-ui/core": "0.6.0",
            "@rbxts/react": "17.3.7-ts.2",
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    const resolveLatestVersionsFn = createResolvedVersions("1.2.3");

    await runInitCommand(
      {
        cwd: dir,
        pm: "npm",
        yes: true,
        dryRun: false,
        lint: false,
      },
      {
        detectPackageManagerFn: vi.fn(async () => ({
          name: "npm" as const,
          manager: createPackageManager(),
          lockfiles: [],
          installed: ["npm" as const],
          source: "override" as const,
          pins: [],
        })),
        resolveLatestVersionsFn,
      },
    );

    const manifest = JSON.parse(await readFile(path.join(dir, "package.json"), "utf8"));

    expect(manifest.dependencies["@lattice-ui/style"]).toBeUndefined();
    expect(manifest.dependencies["@lattice-ui/core"]).toBeUndefined();
    expect(manifest.dependencies["@lattice-ui/react-style"]).toBe("1.2.3");
    expect(manifest.dependencies["@lattice-ui/react-runtime"]).toBe("1.2.3");
    expect(resolveLatestVersionsFn.mock.calls[0][0]).toContain("@lattice-ui/react-runtime");
  });

  it("init rolls back every file change when the install fails", async () => {
    const dir = await createTempDir();
    const originalManifest = JSON.stringify({ name: "tmp" }, null, 2);
    await writeFile(path.join(dir, "package.json"), originalManifest, "utf8");

    const install = vi.fn(async () => {
      throw new Error("npm install exited with code 1.");
    });

    await expect(
      runInitCommand(
        {
          cwd: dir,
          pm: "npm",
          yes: true,
          dryRun: false,
          lint: false,
        },
        {
          detectPackageManagerFn: vi.fn(async () => ({
            name: "npm" as const,
            manager: createPackageManager({ install }),
            lockfiles: [],
            installed: ["npm" as const],
            source: "override" as const,
            pins: [],
          })),
          resolveLatestVersionsFn: createResolvedVersions(),
        },
      ),
    ).rejects.toThrow(/npm install exited with code 1/);

    expect(await readFile(path.join(dir, "package.json"), "utf8")).toBe(originalManifest);
    await expect(access(path.join(dir, "default.project.json"))).rejects.toThrow();
    await expect(access(path.join(dir, "src"))).rejects.toThrow();
    await expect(access(path.join(dir, "out"))).rejects.toThrow();
  });

  it("create discards the project directory when the install fails", async () => {
    const dir = await createTempDir();
    const projectRoot = path.join(dir, "my-game");

    const install = vi.fn(async () => {
      throw new Error("npm install exited with code 1.");
    });

    await expect(
      runCreateCommand(
        {
          cwd: dir,
          projectPath: "my-game",
          yes: true,
          pm: "npm",
          template: "rbxts",
          git: false,
        },
        {
          detectPackageManagerFn: vi.fn(async () => ({
            name: "npm" as const,
            manager: createPackageManager({ install }),
            lockfiles: [],
            installed: ["npm" as const],
            source: "override" as const,
            pins: [],
          })),
          resolveLatestVersionsFn: createResolvedVersions(),
        },
      ),
    ).rejects.toThrow(/npm install exited with code 1/);

    await expect(access(projectRoot)).rejects.toThrow();
  });

  it("init fails when package.json cannot be found", async () => {
    const dir = await createTempDir();

    await expect(
      runInitCommand({
        cwd: dir,
        yes: true,
        dryRun: false,
      }),
    ).rejects.toThrow(/could not find package\.json/i);
  });

  it("init repins a pnpm-scaffolded project when npm is selected", async () => {
    const dir = await createTempDir();
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify(
        {
          name: "tmp",
          devEngines: { packageManager: { name: "pnpm", version: "^11.10.0", onFail: "download" } },
        },
        null,
        2,
      ),
      "utf8",
    );

    const install = vi.fn(async () => undefined);

    await runInitCommand(
      {
        cwd: dir,
        pm: "npm",
        yes: true,
        dryRun: false,
      },
      {
        detectPackageManagerFn: async (cwd, override, options) => {
          const result = await detectPackageManager(cwd, override, {
            ...options,
            detectInstalledPackageManagersFn: async () => ["npm", "pnpm"],
          });

          return {
            ...result,
            manager: createPackageManager({ name: result.name, install }),
          };
        },
        resolveLatestVersionsFn: createResolvedVersions(),
      },
    );

    const manifest = JSON.parse(await readFile(path.join(dir, "package.json"), "utf8"));

    expect(manifest.devEngines).toEqual({ packageManager: { name: "npm", onFail: "download" } });
    expect(install).toHaveBeenCalledWith(dir);
  });

  it("init uses defaults in --yes mode without prompts", async () => {
    const dir = await createTempDir();
    await writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "tmp" }, null, 2), "utf8");

    const install = vi.fn(async () => undefined);
    const promptSelectFn = vi.fn();
    const promptConfirmFn = vi.fn();

    await runInitCommand(
      {
        cwd: dir,
        yes: true,
        dryRun: false,
      },
      {
        promptSelectFn,
        promptConfirmFn,
        detectPackageManagerFn: vi.fn(async (_cwd: string, override?: string) => ({
          name: (override ?? "npm") as "npm" | "pnpm" | "yarn",
          manager: createPackageManager({
            name: (override ?? "npm") as "npm" | "pnpm" | "yarn",
            install,
          }),
          lockfiles: [],
          installed: [(override ?? "npm") as "npm" | "pnpm" | "yarn"],
          source: override ? ("override" as const) : ("installed" as const),
          pins: [],
        })),
        resolveLatestVersionsFn: createResolvedVersions(),
      },
    );

    expect(promptSelectFn).not.toHaveBeenCalled();
    expect(promptConfirmFn).not.toHaveBeenCalled();
    expect(install).toHaveBeenCalledWith(dir);
  });

  it("init prompts for omitted package manager and lint choices", async () => {
    const dir = await createTempDir();
    await writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "tmp" }, null, 2), "utf8");

    const install = vi.fn(async () => undefined);
    const promptSelectFn = vi.fn(async () => "pnpm");
    const promptConfirmFn = vi.fn(async () => false);

    await runInitCommand(
      {
        cwd: dir,
        yes: false,
        dryRun: false,
      },
      {
        promptSelectFn,
        promptConfirmFn,
        detectPackageManagerFn: async (cwd, override, options) => {
          const result = await detectPackageManager(cwd, override, {
            ...options,
            runtime: {
              ...options?.runtime,
              yes: options?.runtime?.yes ?? false,
              stdin: { isTTY: true } as NodeJS.ReadStream,
              stdout: { isTTY: true } as NodeJS.WriteStream,
            },
            detectInstalledPackageManagersFn: async () => ["npm", "pnpm"],
          });

          return {
            ...result,
            manager: createPackageManager({
              name: result.name,
              install,
            }),
          };
        },
        resolveLatestVersionsFn: createResolvedVersions(),
        createLoggerFn: () => createLogger(),
      },
    );

    expect(promptSelectFn).toHaveBeenCalledWith(
      expect.objectContaining({ yes: false }),
      "Select a package manager",
      [
        { label: "npm", value: "npm" },
        { label: "pnpm", value: "pnpm" },
      ],
      { defaultIndex: 0 },
    );
    expect(promptConfirmFn).toHaveBeenCalledWith(expect.objectContaining({ yes: false }), "Set up ESLint + Prettier?", {
      defaultValue: false,
    });
    expect(install).toHaveBeenCalledWith(dir);
  });

  it("init dry-run reports changes without mutating files", async () => {
    const dir = await createTempDir();
    const install = vi.fn(async () => undefined);
    const logger = createLogger();
    await writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "tmp" }, null, 2), "utf8");

    await runInitCommand(
      {
        cwd: dir,
        yes: true,
        dryRun: true,
      },
      {
        createLoggerFn: () => logger,
        detectPackageManagerFn: vi.fn(async (_cwd: string, override?: string) => ({
          name: (override ?? "npm") as "npm" | "pnpm" | "yarn",
          manager: createPackageManager({ install }),
          lockfiles: [],
          installed: [(override ?? "npm") as "npm" | "pnpm" | "yarn"],
          source: override ? ("override" as const) : ("installed" as const),
          pins: [],
        })),
        resolveLatestVersionsFn: createResolvedVersions(),
      },
    );

    await expect(readFile(path.join(dir, "tsconfig.json"), "utf8")).rejects.toThrow();
    await expect(readFile(path.join(dir, ".gitignore"), "utf8")).rejects.toThrow();
    expect(install).not.toHaveBeenCalled();
    expect(logger.header).toHaveBeenCalledWith("lattice init", "dry run");
    expect(commandsOf(logger)).toContain("npm install");
    expect(outcomesOf(logger)).toContain("Nothing changed. Re-run without --dry-run to apply.");
  });

  it("init safely bootstraps an existing project and appends gitignore entries", async () => {
    const dir = await createTempDir();
    const install = vi.fn(async () => undefined);
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify(
        {
          name: "existing-game",
          version: "3.2.1",
          scripts: {
            build: "custom-build",
          },
          dependencies: {
            "@lattice-ui/react-style": "workspace:*",
          },
        },
        null,
        2,
      ),
      "utf8",
    );
    await writeFile(path.join(dir, ".gitignore"), "dist\n", "utf8");
    await writeFile(
      path.join(dir, "tsconfig.json"),
      `{
  "compilerOptions": {
    // existing config
    "jsx": "react",
    "typeRoots": ["node_modules/@rbxts"],
  }
}
`,
      "utf8",
    );
    await mkdir(path.join(dir, "src", "client"), { recursive: true });
    await writeFile(path.join(dir, "src", "client", "App.tsx"), "export const App = 'existing';\n", "utf8");

    await runInitCommand(
      {
        cwd: dir,
        yes: true,
        dryRun: false,
      },
      {
        detectPackageManagerFn: vi.fn(async (_cwd: string, override?: string) => ({
          name: (override ?? "npm") as "npm" | "pnpm" | "yarn",
          manager: createPackageManager({ install }),
          lockfiles: [],
          installed: [(override ?? "npm") as "npm" | "pnpm" | "yarn"],
          source: override ? ("override" as const) : ("installed" as const),
          pins: [],
        })),
        resolveLatestVersionsFn: createResolvedVersions("9.9.9"),
      },
    );

    const manifest = JSON.parse(await readFile(path.join(dir, "package.json"), "utf8")) as {
      version: string;
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    const defaultProject = JSON.parse(await readFile(path.join(dir, "default.project.json"), "utf8")) as {
      name: string;
      globIgnorePaths: string[];
      tree: {
        ServerScriptService: Record<string, unknown>;
        ReplicatedStorage: Record<string, unknown>;
        StarterPlayer: Record<string, unknown>;
        Workspace: Record<string, unknown>;
        HttpService: Record<string, unknown>;
        SoundService: Record<string, unknown>;
      };
    };
    const mergedTsconfig = JSON.parse(await readFile(path.join(dir, "tsconfig.json"), "utf8")) as {
      compilerOptions: { typeRoots: string[] };
      rbxts?: unknown;
    };
    const mainClient = await readFile(path.join(dir, "src", "client", "main.client.tsx"), "utf8");
    expect(manifest.version).toBe("3.2.1");
    expect(manifest.scripts.build).toBe("custom-build");
    expect(manifest.scripts.watch).toBe("rbxtsc -p tsconfig.json -w");
    expect(manifest.dependencies["@lattice-ui/react-style"]).toBe("workspace:*");
    expect(manifest.dependencies["@rbxts/react"]).toBe("9.9.9");
    expect(manifest.devDependencies["lattice-ui"]).toBe("9.9.9");
    expect(defaultProject.name).toBe("existing-game");
    expect(defaultProject.globIgnorePaths).toEqual(["**/package.json", "**/tsconfig.json"]);
    expect(defaultProject.tree.ServerScriptService).toHaveProperty("TS.$path", "out/server");
    expect(defaultProject.tree.ReplicatedStorage).toHaveProperty("rbxts_include.$path", "include");
    expect(defaultProject.tree.ReplicatedStorage).toHaveProperty(
      "rbxts_include.node_modules.@rbxts.$path",
      "node_modules/@rbxts",
    );
    expect(defaultProject.tree.ReplicatedStorage).toHaveProperty(
      "node_modules.@lattice-ui.$path",
      "node_modules/@lattice-ui",
    );
    expect(defaultProject.tree.ReplicatedStorage).toHaveProperty("node_modules.@rbxts.$path", "node_modules/@rbxts");
    expect(defaultProject.tree.ReplicatedStorage).toHaveProperty(
      "node_modules.@rbxts-js.$path",
      "node_modules/@rbxts-js",
    );
    expect(defaultProject.tree.ReplicatedStorage).toHaveProperty("TS.$path", "out/shared");
    expect(defaultProject.tree.StarterPlayer).toHaveProperty("StarterPlayerScripts.TS.$path", "out/client");
    expect(defaultProject.tree.Workspace).toHaveProperty("$properties.FilteringEnabled", true);
    expect(defaultProject.tree.HttpService).toHaveProperty("$properties.HttpEnabled", true);
    expect(defaultProject.tree.SoundService).toHaveProperty("$properties.RespectFilteringEnabled", true);
    expect(await readFile(path.join(dir, "src", "client", "App.tsx"), "utf8")).toBe("export const App = 'existing';\n");
    expect(mainClient).toContain('import { defaultLightTheme, ThemeProvider } from "@lattice-ui/react-style";');
    expect(mergedTsconfig.compilerOptions.typeRoots).toEqual(["node_modules/@rbxts", "node_modules/@lattice-ui"]);
    expect(mergedTsconfig.rbxts).toBeUndefined();
    const gitignore = await readFile(path.join(dir, ".gitignore"), "utf8");
    expect(gitignore).toContain("dist");
    expect(gitignore).toContain("node_modules");
    expect(gitignore).toContain("out");
    expect(gitignore).toContain("include");
    expect(gitignore).toContain("*.rbxlx");
    expect(gitignore).toContain("*.tsbuildinfo");
    await expect(access(path.join(dir, "include"))).resolves.toBeUndefined();
    await expect(access(path.join(dir, "out", "shared"))).resolves.toBeUndefined();
    await expect(access(path.join(dir, "out", "server"))).resolves.toBeUndefined();
    await expect(access(path.join(dir, "out", "client"))).resolves.toBeUndefined();
    expect(install).toHaveBeenCalledWith(dir);
  });

  it("init merges missing ReplicatedStorage node_modules entries into an existing default.project.json", async () => {
    const dir = await createTempDir();
    await writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "existing-game" }, null, 2), "utf8");
    await writeFile(
      path.join(dir, "default.project.json"),
      JSON.stringify(
        {
          name: "existing-game",
          tree: {
            ReplicatedStorage: {
              node_modules: {
                "@rbxts": {
                  $path: "custom/node_modules/@rbxts",
                },
              },
              ExistingFolder: {
                $className: "Folder",
              },
            },
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    await runInitCommand(
      {
        cwd: dir,
        yes: true,
        dryRun: false,
      },
      {
        detectPackageManagerFn: vi.fn(async (_cwd: string, override?: string) => ({
          name: (override ?? "npm") as "npm" | "pnpm" | "yarn",
          manager: createPackageManager(),
          lockfiles: [],
          installed: [(override ?? "npm") as "npm" | "pnpm" | "yarn"],
          source: override ? ("override" as const) : ("installed" as const),
          pins: [],
        })),
        resolveLatestVersionsFn: createResolvedVersions("1.2.3"),
      },
    );

    const defaultProject = JSON.parse(await readFile(path.join(dir, "default.project.json"), "utf8")) as {
      tree: {
        ReplicatedStorage: {
          ExistingFolder: {
            $className: string;
          };
          node_modules: {
            "@lattice-ui": {
              $path: string;
            };
            "@rbxts": {
              $path: string;
            };
            "@rbxts-js": {
              $path: string;
            };
          };
        };
      };
    };

    expect(defaultProject.tree.ReplicatedStorage.ExistingFolder.$className).toBe("Folder");
    expect(defaultProject.tree.ReplicatedStorage.node_modules["@lattice-ui"].$path).toBe("node_modules/@lattice-ui");
    expect(defaultProject.tree.ReplicatedStorage.node_modules["@rbxts"].$path).toBe("custom/node_modules/@rbxts");
    expect(defaultProject.tree.ReplicatedStorage.node_modules["@rbxts-js"].$path).toBe("node_modules/@rbxts-js");
  });

  it("init keeps existing dependency and script values when names already exist", async () => {
    const dir = await createTempDir();
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify(
        {
          name: "existing-game",
          scripts: {
            build: "custom-build",
            watch: "custom-watch",
            typecheck: "custom-typecheck",
          },
          dependencies: {
            "@lattice-ui/react-style": "workspace:*",
            "@rbxts/react": "18.0.0",
            "@rbxts/react-roblox": "18.0.0",
          },
          devDependencies: {
            "lattice-ui": "workspace:*",
            "roblox-ts": "99.0.0",
            typescript: "99.0.0",
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    await runInitCommand(
      {
        cwd: dir,
        yes: true,
        dryRun: false,
      },
      {
        detectPackageManagerFn: vi.fn(async (_cwd: string, override?: string) => ({
          name: (override ?? "npm") as "npm" | "pnpm" | "yarn",
          manager: createPackageManager(),
          lockfiles: [],
          installed: [(override ?? "npm") as "npm" | "pnpm" | "yarn"],
          source: override ? ("override" as const) : ("installed" as const),
          pins: [],
        })),
        resolveLatestVersionsFn: createResolvedVersions("1.2.3"),
      },
    );

    const manifest = JSON.parse(await readFile(path.join(dir, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(manifest.scripts.build).toBe("custom-build");
    expect(manifest.scripts.watch).toBe("custom-watch");
    expect(manifest.scripts.typecheck).toBe("custom-typecheck");
    expect(manifest.dependencies["@lattice-ui/react-style"]).toBe("workspace:*");
    expect(manifest.dependencies["@rbxts/react"]).toBe("18.0.0");
    expect(manifest.dependencies["@rbxts/react-roblox"]).toBe("18.0.0");
    expect(manifest.devDependencies["lattice-ui"]).toBe("workspace:*");
    expect(manifest.devDependencies["roblox-ts"]).toBe("99.0.0");
    expect(manifest.devDependencies["typescript"]).toBe("99.0.0");
  });

  it("init writes pnpm hoisted linker config", async () => {
    const dir = await createTempDir();
    const install = vi.fn(async () => undefined);
    await writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "tmp" }, null, 2), "utf8");

    await runInitCommand(
      {
        cwd: dir,
        yes: true,
        dryRun: false,
        pm: "pnpm",
      },
      {
        detectPackageManagerFn: vi.fn(async (_cwd: string, override?: string) => ({
          name: (override ?? "pnpm") as "npm" | "pnpm" | "yarn",
          manager: createPackageManager({ name: "pnpm", install }),
          lockfiles: [],
          installed: [(override ?? "pnpm") as "npm" | "pnpm" | "yarn"],
          source: override ? ("override" as const) : ("installed" as const),
          pins: [],
        })),
        resolveLatestVersionsFn: createResolvedVersions("1.2.3"),
      },
    );

    const defaultProject = JSON.parse(await readFile(path.join(dir, "default.project.json"), "utf8")) as {
      tree: {
        ReplicatedStorage: Record<string, unknown>;
      };
    };
    const npmrc = await readFile(path.join(dir, ".npmrc"), "utf8");

    expect(defaultProject.tree.ReplicatedStorage).toHaveProperty(
      "node_modules.@rbxts-js.$path",
      "node_modules/@rbxts-js",
    );
    expect(npmrc).toBe("node-linker=hoisted\n");
    expect(install).toHaveBeenCalledWith(dir);
  });

  it("init only adds lint configuration when --lint is enabled", async () => {
    const plainDir = await createTempDir();
    const lintDir = await createTempDir();
    await writeFile(path.join(plainDir, "package.json"), JSON.stringify({ name: "plain" }, null, 2), "utf8");
    await writeFile(path.join(lintDir, "package.json"), JSON.stringify({ name: "lint" }, null, 2), "utf8");

    const detectPackageManagerFn = vi.fn(async (_cwd: string, override?: string) => ({
      name: (override ?? "npm") as "npm" | "pnpm" | "yarn",
      manager: createPackageManager(),
      lockfiles: [],
      installed: [(override ?? "npm") as "npm" | "pnpm" | "yarn"],
      source: override ? ("override" as const) : ("installed" as const),
      pins: [],
    }));

    await runInitCommand(
      {
        cwd: plainDir,
        yes: true,
        dryRun: false,
      },
      {
        detectPackageManagerFn,
        resolveLatestVersionsFn: createResolvedVersions(),
      },
    );

    await runInitCommand(
      {
        cwd: lintDir,
        yes: true,
        dryRun: false,
        lint: true,
      },
      {
        detectPackageManagerFn,
        resolveLatestVersionsFn: createResolvedVersions(),
      },
    );

    await expect(readFile(path.join(plainDir, "eslint.config.mjs"), "utf8")).rejects.toThrow();
    await expect(readFile(path.join(plainDir, ".prettierrc"), "utf8")).rejects.toThrow();
    await expect(readFile(path.join(lintDir, "eslint.config.mjs"), "utf8")).resolves.toContain(
      "@typescript-eslint/parser",
    );
    await expect(readFile(path.join(lintDir, ".prettierrc"), "utf8")).resolves.toContain('"printWidth": 120');
  });

  it("init is idempotent and skips install on the second run", async () => {
    const dir = await createTempDir();
    const install = vi.fn(async () => undefined);
    const logger = createLogger();
    await writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "tmp" }, null, 2), "utf8");

    await runInitCommand(
      {
        cwd: dir,
        yes: true,
        dryRun: false,
      },
      {
        detectPackageManagerFn: vi.fn(async (_cwd: string, override?: string) => ({
          name: (override ?? "npm") as "npm" | "pnpm" | "yarn",
          manager: createPackageManager({ install }),
          lockfiles: [],
          installed: [(override ?? "npm") as "npm" | "pnpm" | "yarn"],
          source: override ? ("override" as const) : ("installed" as const),
          pins: [],
        })),
        resolveLatestVersionsFn: createResolvedVersions(),
      },
    );

    install.mockClear();

    await runInitCommand(
      {
        cwd: dir,
        yes: true,
        dryRun: false,
      },
      {
        createLoggerFn: () => logger,
        detectPackageManagerFn: vi.fn(async (_cwd: string, override?: string) => ({
          name: (override ?? "npm") as "npm" | "pnpm" | "yarn",
          manager: createPackageManager({ install }),
          lockfiles: [],
          installed: [(override ?? "npm") as "npm" | "pnpm" | "yarn"],
          source: override ? ("override" as const) : ("installed" as const),
          pins: [],
        })),
        resolveLatestVersionsFn: createResolvedVersions(),
      },
    );

    expect(install).not.toHaveBeenCalled();
    expect(outcomesOf(logger)).toContain("Project already matches the Lattice init template.");
  });

  it("add expands presets and installs peers, excluding optional providers", async () => {
    const dir = await createTempDir();
    await writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "tmp", dependencies: {} }, null, 2), "utf8");

    const add = vi.fn(async () => undefined);
    const ctx = createContext({
      projectRoot: dir,
      pm: { name: "npm", add },
      registry: {
        packages: {
          popover: {
            npm: "@lattice-ui/react-popover",
            peers: ["@rbxts/react", "@rbxts/react-roblox"],
            providers: ["@lattice-ui/react-layer:PortalProvider?"],
          },
        },
        presets: {
          overlay: ["popover"],
        },
      },
    });

    await runAddCommand(ctx, { names: [], presets: ["overlay"] });

    expect(add).toHaveBeenCalledTimes(1);
    const specs = ((add.mock.calls[0] as unknown as unknown[])?.[1] as unknown as string[]) ?? [];
    expect(specs).toEqual(["@lattice-ui/react-popover", "@rbxts/react", "@rbxts/react-roblox"]);
    expect(specs).not.toContain("@lattice-ui/react-layer");
  });

  it("add dry-run follows the compact output contract", async () => {
    const dir = await createTempDir();
    await writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "tmp", dependencies: {} }, null, 2), "utf8");

    const logger = createLogger();
    const ctx = createContext({
      projectRoot: dir,
      options: { dryRun: true },
      logger,
      registry: {
        packages: {
          style: {
            npm: "@lattice-ui/react-style",
          },
        },
        presets: {},
      },
    });

    await runAddCommand(ctx, { names: ["style"], presets: [] });

    expect(logger.header).toHaveBeenCalledWith("lattice add", "dry run");
    expect(fieldsOf(logger)).toMatchObject({ Components: "style" });
    expect(commandsOf(logger)).toEqual([expect.stringMatching(/^npm add /)]);
    expect(nextOf(logger)).toContain("npx lattice-ui doctor");

    // A dry run must not claim the install happened.
    expect(groupsOf(logger)).toHaveProperty("Would install 1 package");
    expect(outcomesOf(logger)).toEqual(["Nothing changed. Re-run without --dry-run to apply."]);
  });

  it("add requires explicit selection in --yes mode", async () => {
    const dir = await createTempDir();
    await writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "tmp", dependencies: {} }, null, 2), "utf8");

    const ctx = createContext({
      projectRoot: dir,
      options: { yes: true },
      registry: {
        packages: {
          style: {
            npm: "@lattice-ui/react-style",
          },
        },
        presets: {},
      },
    });

    await expect(runAddCommand(ctx, { names: [], presets: [] })).rejects.toThrow(/when using --yes/i);
  });

  it("remove deletes selected installed component packages", async () => {
    const dir = await createTempDir();
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify(
        {
          name: "tmp",
          dependencies: {
            "@lattice-ui/react-style": "workspace:*",
            "@rbxts/react": "17",
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    const remove = vi.fn(async () => undefined);
    const ctx = createContext({
      projectRoot: dir,
      pm: { name: "npm", remove },
      registry: {
        packages: {
          style: { npm: "@lattice-ui/react-style" },
          dialog: { npm: "@lattice-ui/react-dialog" },
        },
        presets: {},
      },
    });

    await runRemoveCommand(ctx, { names: ["style"], presets: [] });

    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove.mock.calls[0]).toEqual([["@lattice-ui/react-style"], dir]);
  });

  it("remove dry-run follows the compact output contract", async () => {
    const dir = await createTempDir();
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify(
        {
          name: "tmp",
          dependencies: {
            "@lattice-ui/react-style": "workspace:*",
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    const logger = createLogger();
    const ctx = createContext({
      projectRoot: dir,
      options: { dryRun: true, yes: true },
      logger,
      registry: {
        packages: {
          style: { npm: "@lattice-ui/react-style" },
        },
        presets: {},
      },
    });

    await runRemoveCommand(ctx, { names: ["style"], presets: [] });

    expect(logger.header).toHaveBeenCalledWith("lattice remove", "dry run");
    expect(commandsOf(logger)).toEqual([expect.stringContaining("npm remove @lattice-ui/react-style")]);
    expect(outcomesOf(logger)).toEqual(["Nothing changed. Re-run without --dry-run to apply."]);
    expect(nextOf(logger)).toContain("npx lattice-ui doctor");
  });

  it("remove skips requested components that are not installed", async () => {
    const dir = await createTempDir();
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify(
        {
          name: "tmp",
          dependencies: {
            "@lattice-ui/react-style": "workspace:*",
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    const logger = createLogger();
    const remove = vi.fn(async () => undefined);
    const ctx = createContext({
      projectRoot: dir,
      logger,
      pm: { name: "npm", remove },
      registry: {
        packages: {
          style: { npm: "@lattice-ui/react-style" },
          dialog: { npm: "@lattice-ui/react-dialog" },
        },
        presets: {},
      },
    });

    await runRemoveCommand(ctx, { names: ["style", "dialog"], presets: [] });

    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove.mock.calls[0]).toEqual([["@lattice-ui/react-style"], dir]);
    expect(groupsOf(logger)["Not installed, skipped"]).toEqual(["dialog"]);
  });

  it("remove reports no-installed result and next steps", async () => {
    const dir = await createTempDir();
    await writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "tmp", dependencies: {} }, null, 2), "utf8");

    const logger = createLogger();
    const ctx = createContext({
      projectRoot: dir,
      options: { yes: false },
      logger,
      registry: {
        packages: {
          style: { npm: "@lattice-ui/react-style" },
        },
        presets: {},
      },
    });

    await runRemoveCommand(ctx, { names: [], presets: [] });

    expect(logger.outcome).toHaveBeenCalledWith("No installed registry components to remove.", "warn");
    expect(nextOf(logger)).toContain("npx lattice-ui doctor");
  });

  it("remove interactive no-arg path selects from installed components", async () => {
    const dir = await createTempDir();
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify(
        {
          name: "tmp",
          dependencies: {
            "@lattice-ui/react-style": "workspace:*",
            "@lattice-ui/react-dialog": "workspace:*",
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    const promptSpy = vi.spyOn(promptModule, "promptMultiSelect").mockResolvedValue(["dialog"]);
    const remove = vi.fn(async () => undefined);
    const ctx = createContext({
      projectRoot: dir,
      options: { yes: false },
      pm: { name: "npm", remove },
      registry: {
        packages: {
          style: { npm: "@lattice-ui/react-style" },
          dialog: { npm: "@lattice-ui/react-dialog" },
          toast: { npm: "@lattice-ui/react-toast" },
        },
        presets: {},
      },
    });

    await runRemoveCommand(ctx, { names: [], presets: [] });

    expect(promptSpy).toHaveBeenCalled();
    expect(promptSpy.mock.calls[0]?.[2]).toEqual([
      { label: "dialog", value: "dialog" },
      { label: "style", value: "style" },
    ]);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove.mock.calls[0]).toEqual([["@lattice-ui/react-dialog"], dir]);
    promptSpy.mockRestore();
  });

  it("upgrade preserves dependency field intent", async () => {
    const dir = await createTempDir();
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify(
        {
          name: "tmp",
          dependencies: {
            "@lattice-ui/react-style": "workspace:*",
          },
          devDependencies: {
            "@lattice-ui/react-popover": "workspace:*",
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    const add = vi.fn(async () => undefined);
    const ctx = createContext({
      projectRoot: dir,
      pm: { name: "npm", add },
      registry: {
        packages: {
          style: { npm: "@lattice-ui/react-style" },
          popover: { npm: "@lattice-ui/react-popover" },
        },
        presets: {},
      },
    });

    await runUpgradeCommand(ctx, { names: [], presets: [] });

    expect(add).toHaveBeenCalledTimes(2);
    expect(add.mock.calls[0]).toEqual([false, ["@lattice-ui/react-style@latest"], dir]);
    expect(add.mock.calls[1]).toEqual([true, ["@lattice-ui/react-popover@latest"], dir]);
  });

  it("upgrade dry-run follows the compact output contract", async () => {
    const dir = await createTempDir();
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify(
        {
          name: "tmp",
          dependencies: {
            "@lattice-ui/react-style": "workspace:*",
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    const logger = createLogger();
    const ctx = createContext({
      projectRoot: dir,
      options: { dryRun: true, yes: true },
      logger,
      registry: {
        packages: {
          style: { npm: "@lattice-ui/react-style" },
        },
        presets: {},
      },
    });

    await runUpgradeCommand(ctx, { names: ["style"], presets: [] });

    expect(logger.header).toHaveBeenCalledWith("lattice upgrade", "dry run");
    expect(commandsOf(logger)).toEqual([expect.stringContaining("npm add @lattice-ui/react-style@latest")]);
    expect(outcomesOf(logger)).toEqual(["Nothing changed. Re-run without --dry-run to apply."]);
    expect(nextOf(logger)).toContain("npx lattice-ui doctor");
  });

  it("upgrade summarizes long selection lists with overflow count", async () => {
    const dir = await createTempDir();
    const dependencyEntries = Object.fromEntries(
      Array.from({ length: 10 }, (_, index) => [`@lattice-ui/pkg-${index}`, "workspace:*"]),
    );
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "tmp", dependencies: dependencyEntries }, null, 2),
      "utf8",
    );

    const logger = createLogger();
    const registryPackages = Object.fromEntries(
      Array.from({ length: 10 }, (_, index) => [`component-${index}`, { npm: `@lattice-ui/pkg-${index}` }]),
    );
    const ctx = createContext({
      projectRoot: dir,
      options: { dryRun: true, yes: true },
      logger,
      registry: {
        packages: registryPackages,
        presets: {},
      },
    });

    await runUpgradeCommand(ctx, {
      names: Array.from({ length: 10 }, (_, index) => `component-${index}`),
      presets: [],
    });

    expect(groupsOf(logger)["Would upgrade 10 dependencies"]).toHaveLength(10);
  });

  it("upgrade reports a clear result when no requested packages are installed", async () => {
    const dir = await createTempDir();
    await writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "tmp", dependencies: {} }, null, 2), "utf8");

    const logger = createLogger();
    const ctx = createContext({
      projectRoot: dir,
      options: { dryRun: true, yes: true },
      logger,
      registry: {
        packages: {
          style: { npm: "@lattice-ui/react-style" },
        },
        presets: {},
      },
    });

    await runUpgradeCommand(ctx, { names: ["style"], presets: [] });

    expect(logger.outcome).toHaveBeenCalledWith("No installed @lattice-ui/* package matched the selection.", "warn");
    expect(nextOf(logger)).toContain("npx lattice-ui doctor");
  });

  it("doctor recommends local package-manager aware commands", async () => {
    const dir = await createTempDir();
    await writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "tmp", dependencies: {} }, null, 2), "utf8");

    const logger = createLogger();
    const ctx = createContext({
      projectRoot: dir,
      logger,
      pm: { name: "pnpm" },
      registry: {
        packages: {},
        presets: {},
      },
    });

    await expect(runDoctorCommand(ctx)).resolves.toBeUndefined();

    expect(logger.header).toHaveBeenCalledWith("lattice doctor");
    expect(nextOf(logger)).toContain("pnpm lattice add <component>");
  });

  it("doctor ignores lattice-ui as a tooling package", async () => {
    const dir = await createTempDir();
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify(
        {
          name: "tmp",
          devDependencies: {
            "lattice-ui": "^0.4.0",
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    const logger = createLogger();
    const ctx = createContext({
      projectRoot: dir,
      logger,
      registry: {
        packages: {},
        presets: {},
      },
    });

    await expect(runDoctorCommand(ctx)).resolves.toBeUndefined();

    const listedMessages = Object.values(groupsOf(logger)).flat();

    expect(listedMessages).not.toContain("lattice-ui is installed but not found in CLI registry.");
    expect(listedMessages).toContain("No @lattice-ui component packages are installed.");
  });

  it("doctor warns when typescript is on an unsupported major", async () => {
    const dir = await createTempDir();
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify(
        {
          name: "tmp",
          dependencies: { "@lattice-ui/react-style": "0.6.1" },
          devDependencies: { typescript: "7.0.2" },
        },
        null,
        2,
      ),
      "utf8",
    );

    const logger = createLogger();
    const ctx = createContext({
      projectRoot: dir,
      logger,
      registry: {
        packages: { style: { npm: "@lattice-ui/react-style" } },
        presets: {},
      },
    });

    await expect(runDoctorCommand(ctx)).resolves.toBeUndefined();

    const listedMessages = Object.values(groupsOf(logger)).flat();

    expect(listedMessages).toContain("typescript is pinned to 7.0.2, but roblox-ts compiles with 5.5.3.");
    expect(nextOf(logger)).toContain("npm install -D typescript@5.5.3");
  });

  it("doctor accepts a supported typescript range", async () => {
    const dir = await createTempDir();
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify(
        {
          name: "tmp",
          dependencies: { "@lattice-ui/react-style": "0.6.1" },
          devDependencies: { typescript: "^5.5.3" },
        },
        null,
        2,
      ),
      "utf8",
    );

    const logger = createLogger();
    const ctx = createContext({
      projectRoot: dir,
      logger,
      registry: {
        packages: { style: { npm: "@lattice-ui/react-style" } },
        presets: {},
      },
    });

    await expect(runDoctorCommand(ctx)).resolves.toBeUndefined();

    const listedMessages = Object.values(groupsOf(logger)).flat();

    expect(listedMessages.some((message) => message.includes("roblox-ts compiles with"))).toBe(false);
  });

  it("doctor reports renamed lattice packages as errors", async () => {
    const dir = await createTempDir();
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify(
        {
          name: "tmp",
          dependencies: {
            "@lattice-ui/style": "0.6.0",
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    const logger = createLogger();
    const ctx = createContext({
      projectRoot: dir,
      logger,
      registry: {
        packages: {},
        presets: {},
      },
    });

    await expect(runDoctorCommand(ctx)).rejects.toThrow(/1 error/);

    const listedMessages = Object.values(groupsOf(logger)).flat();

    expect(listedMessages).toContain(
      "@lattice-ui/style was renamed to @lattice-ui/react-style; the old name no longer receives releases.",
    );
  });

  it("doctor throws on required provider errors but not warnings", async () => {
    const dir = await createTempDir();
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify(
        {
          name: "tmp",
          dependencies: {
            "@lattice-ui/react-popover": "^0.1.0",
            "@rbxts/react": "17",
            "@rbxts/react-roblox": "17",
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    const warningCtx = createContext({
      projectRoot: dir,
      registry: {
        packages: {
          popover: {
            npm: "@lattice-ui/react-popover",
            peers: ["@rbxts/react", "@rbxts/react-roblox"],
            providers: ["@lattice-ui/react-layer:PortalProvider?"],
          },
        },
        presets: {},
      },
    });

    await expect(runDoctorCommand(warningCtx)).resolves.toBeUndefined();

    const errorCtx = createContext({
      projectRoot: dir,
      registry: {
        packages: {
          popover: {
            npm: "@lattice-ui/react-popover",
            peers: ["@rbxts/react", "@rbxts/react-roblox"],
            providers: ["@lattice-ui/react-layer:PortalProvider"],
          },
        },
        presets: {},
      },
    });

    await expect(runDoctorCommand(errorCtx)).rejects.toThrow(/doctor found/i);
    // Warnings alone must not fail the command, and they land in their own titled group.
    expect(Object.keys(groupsOf(warningCtx.logger)).join()).toMatch(/warning/);
  });
});
