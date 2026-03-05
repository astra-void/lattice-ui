import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runAddCommand } from "../../../packages/cli/src/commands/add";
import { runCreateCommand } from "../../../packages/cli/src/commands/create";
import { runDoctorCommand } from "../../../packages/cli/src/commands/doctor";
import { runRemoveCommand } from "../../../packages/cli/src/commands/remove";
import { runUpgradeCommand } from "../../../packages/cli/src/commands/upgrade";
import type { Logger } from "../../../packages/cli/src/core/logger";
import type { PackageManager } from "../../../packages/cli/src/core/pm/types";
import * as promptModule from "../../../packages/cli/src/core/prompt";
import type { Registry } from "../../../packages/cli/src/core/registry/schema";
import type { CliContext } from "../../../packages/cli/src/ctx";

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
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    section: vi.fn(),
    kv: vi.fn(),
    step: vi.fn(),
    list: vi.fn(),
    confirm: vi.fn(async () => true),
    spinner: vi.fn(() => ({
      succeed: vi.fn(),
      fail: vi.fn(),
      stop: vi.fn(),
    })),
    ...overrides,
  };
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

function createContext(params: {
  projectRoot: string;
  registry: Registry;
  options?: Partial<CliContext["options"]>;
  pm?: Partial<PackageManager>;
  logger?: Logger;
  detectedLockfiles?: CliContext["detectedLockfiles"];
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
        detectPackageManagerFn: vi.fn(async () => ({
          name: "npm",
          manager: createPackageManager({ install }),
          lockfiles: [],
        })),
        resolveLatestVersionsFn: vi.fn(async (packages) =>
          Object.fromEntries(packages.map((packageName) => [packageName, "9.9.9"])),
        ),
      },
    );

    const packageJson = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    expect(packageJson.dependencies["@rbxts/react"]).toBe("9.9.9");
    expect(packageJson.dependencies["@rbxts/react-roblox"]).toBe("9.9.9");
    expect(packageJson.dependencies["@lattice-ui/style"]).toBe("9.9.9");
    expect(packageJson.devDependencies["@lattice-ui/cli"]).toBe("9.9.9");
    expect(packageJson.devDependencies["@eslint/eslintrc"]).toBe("9.9.9");
    expect(packageJson.devDependencies["eslint"]).toBe("9.9.9");
    expect(packageJson.devDependencies["eslint-plugin-roblox-ts"]).toBe("9.9.9");
    expect(packageJson.devDependencies["prettier"]).toBe("9.9.9");
    expect(packageJson.devDependencies["roblox-ts"]).toBe("9.9.9");
    expect(packageJson.scripts.lint).toBe("eslint .");
    expect(packageJson.scripts["format:check"]).toBe("prettier . --check");
    expect(install).toHaveBeenCalledWith(projectRoot);
    await expect(readFile(path.join(projectRoot, "eslint.config.mjs"), "utf8")).resolves.toContain(
      "@typescript-eslint/parser",
    );
    await expect(readFile(path.join(projectRoot, ".prettierrc"), "utf8")).resolves.toContain('"printWidth": 120');
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
        detectPackageManagerFn: vi.fn(async () => ({
          name: "npm",
          manager: createPackageManager({ install }),
          lockfiles: [],
        })),
        resolveLatestVersionsFn: vi.fn(async (packages) =>
          Object.fromEntries(packages.map((packageName) => [packageName, "1.0.0"])),
        ),
      },
    );

    const packageJsonPath = path.join(dir, "my-interactive-game", "package.json");
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as { name: string };
    expect(packageJson.name).toBe("my-interactive-game");
    expect(install).toHaveBeenCalledWith(path.join(dir, "my-interactive-game"));
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
          detectPackageManagerFn: vi.fn(async () => ({
            name: "npm",
            manager: createPackageManager(),
            lockfiles: [],
          })),
          resolveLatestVersionsFn: vi.fn(async () => {
            throw new Error("registry unavailable");
          }),
        },
      ),
    ).rejects.toThrow(/registry unavailable/i);
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
        detectPackageManagerFn: vi.fn(async () => ({
          name: "npm",
          manager: createPackageManager(),
          lockfiles: [],
        })),
        resolveLatestVersionsFn: vi.fn(async (packages) =>
          Object.fromEntries(packages.map((packageName) => [packageName, "1.0.0"])),
        ),
      },
    );

    const packageJson = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(packageJson.devDependencies["@lattice-ui/cli"]).toBe("1.0.0");
    expect(packageJson.devDependencies["@eslint/eslintrc"]).toBeUndefined();
    expect(packageJson.devDependencies["eslint"]).toBeUndefined();
    expect(packageJson.devDependencies["prettier"]).toBeUndefined();
    expect(packageJson.scripts.lint).toBeUndefined();
    await expect(readFile(path.join(projectRoot, "eslint.config.mjs"), "utf8")).rejects.toThrow();
    await expect(readFile(path.join(projectRoot, ".prettierrc"), "utf8")).rejects.toThrow();
  });

  it("create with --git initializes repository and writes .gitignore", async () => {
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
          name: "npm",
          manager: createPackageManager(),
          lockfiles: [],
        })),
        resolveLatestVersionsFn: vi.fn(async (packages) =>
          Object.fromEntries(packages.map((packageName) => [packageName, "1.0.0"])),
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
        detectPackageManagerFn: vi.fn(async () => ({
          name: "npm",
          manager: createPackageManager(),
          lockfiles: [],
        })),
        resolveLatestVersionsFn: vi.fn(async (packages) =>
          Object.fromEntries(packages.map((packageName) => [packageName, "1.0.0"])),
        ),
      },
    );

    expect(logger.section).toHaveBeenCalledWith("Creating a new Lattice app");
    expect(logger.section).toHaveBeenCalledWith("Resolving");
    expect(logger.section).toHaveBeenCalledWith("Scaffolding");
    expect(logger.section).toHaveBeenCalledWith("Configuring");
    expect(logger.section).toHaveBeenCalledWith("Installing");
    expect(logger.section).toHaveBeenCalledWith("Next Steps");
    expect(logger.step).toHaveBeenCalledWith("npx lattice add --preset form");
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
            npm: "@lattice-ui/popover",
            peers: ["@rbxts/react", "@rbxts/react-roblox"],
            providers: ["@lattice-ui/layer:PortalProvider?"],
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
    expect(specs).toEqual(["@lattice-ui/popover", "@rbxts/react", "@rbxts/react-roblox"]);
    expect(specs).not.toContain("@lattice-ui/layer");
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
            npm: "@lattice-ui/style",
          },
        },
        presets: {},
      },
    });

    await runAddCommand(ctx, { names: ["style"], presets: [] });

    expect(logger.section).toHaveBeenNthCalledWith(1, "Selecting");
    expect(logger.section).toHaveBeenNthCalledWith(2, "Planning");
    expect(logger.section).toHaveBeenNthCalledWith(3, "Dry Run");
    expect(logger.section).toHaveBeenNthCalledWith(4, "Result");
    expect(logger.section).toHaveBeenNthCalledWith(5, "Next Steps");
    expect(logger.step).toHaveBeenCalledWith(expect.stringMatching(/^\[dry-run\] npm add/));
    expect(logger.step).toHaveBeenCalledWith("No files were changed.");
    expect(logger.step).toHaveBeenCalledWith("npx lattice doctor");
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
            npm: "@lattice-ui/style",
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
            "@lattice-ui/style": "workspace:*",
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
          style: { npm: "@lattice-ui/style" },
          dialog: { npm: "@lattice-ui/dialog" },
        },
        presets: {},
      },
    });

    await runRemoveCommand(ctx, { names: ["style"], presets: [] });

    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove.mock.calls[0]).toEqual([["@lattice-ui/style"], dir]);
  });

  it("remove dry-run follows the compact output contract", async () => {
    const dir = await createTempDir();
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify(
        {
          name: "tmp",
          dependencies: {
            "@lattice-ui/style": "workspace:*",
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
          style: { npm: "@lattice-ui/style" },
        },
        presets: {},
      },
    });

    await runRemoveCommand(ctx, { names: ["style"], presets: [] });

    expect(logger.section).toHaveBeenNthCalledWith(1, "Selecting");
    expect(logger.section).toHaveBeenNthCalledWith(2, "Planning");
    expect(logger.section).toHaveBeenNthCalledWith(3, "Dry Run");
    expect(logger.section).toHaveBeenNthCalledWith(4, "Result");
    expect(logger.section).toHaveBeenNthCalledWith(5, "Next Steps");
    expect(logger.step).toHaveBeenCalledWith(expect.stringContaining("[dry-run] npm remove @lattice-ui/style"));
    expect(logger.step).toHaveBeenCalledWith("No files were changed.");
    expect(logger.step).toHaveBeenCalledWith("npx lattice doctor");
  });

  it("remove skips requested components that are not installed", async () => {
    const dir = await createTempDir();
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify(
        {
          name: "tmp",
          dependencies: {
            "@lattice-ui/style": "workspace:*",
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
          style: { npm: "@lattice-ui/style" },
          dialog: { npm: "@lattice-ui/dialog" },
        },
        presets: {},
      },
    });

    await runRemoveCommand(ctx, { names: ["style", "dialog"], presets: [] });

    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove.mock.calls[0]).toEqual([["@lattice-ui/style"], dir]);
    expect(logger.kv).toHaveBeenCalledWith("Missing selected", "1");
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
          style: { npm: "@lattice-ui/style" },
        },
        presets: {},
      },
    });

    await runRemoveCommand(ctx, { names: [], presets: [] });

    expect(logger.section).toHaveBeenCalledWith("Result");
    expect(logger.warn).toHaveBeenCalledWith("No installed registry components found to remove.");
    expect(logger.section).toHaveBeenCalledWith("Next Steps");
    expect(logger.step).toHaveBeenCalledWith("npx lattice doctor");
  });

  it("remove interactive no-arg path selects from installed components", async () => {
    const dir = await createTempDir();
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify(
        {
          name: "tmp",
          dependencies: {
            "@lattice-ui/style": "workspace:*",
            "@lattice-ui/dialog": "workspace:*",
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
          style: { npm: "@lattice-ui/style" },
          dialog: { npm: "@lattice-ui/dialog" },
          toast: { npm: "@lattice-ui/toast" },
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
    expect(remove.mock.calls[0]).toEqual([["@lattice-ui/dialog"], dir]);
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
            "@lattice-ui/style": "workspace:*",
          },
          devDependencies: {
            "@lattice-ui/popover": "workspace:*",
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
          style: { npm: "@lattice-ui/style" },
          popover: { npm: "@lattice-ui/popover" },
        },
        presets: {},
      },
    });

    await runUpgradeCommand(ctx, { names: [], presets: [] });

    expect(add).toHaveBeenCalledTimes(2);
    expect(add.mock.calls[0]).toEqual([false, ["@lattice-ui/style@latest"], dir]);
    expect(add.mock.calls[1]).toEqual([true, ["@lattice-ui/popover@latest"], dir]);
  });

  it("upgrade dry-run follows the compact output contract", async () => {
    const dir = await createTempDir();
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify(
        {
          name: "tmp",
          dependencies: {
            "@lattice-ui/style": "workspace:*",
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
          style: { npm: "@lattice-ui/style" },
        },
        presets: {},
      },
    });

    await runUpgradeCommand(ctx, { names: ["style"], presets: [] });

    expect(logger.section).toHaveBeenNthCalledWith(1, "Selecting");
    expect(logger.section).toHaveBeenNthCalledWith(2, "Planning");
    expect(logger.section).toHaveBeenNthCalledWith(3, "Dry Run");
    expect(logger.section).toHaveBeenNthCalledWith(4, "Result");
    expect(logger.section).toHaveBeenNthCalledWith(5, "Next Steps");
    expect(logger.step).toHaveBeenCalledWith(expect.stringContaining("[dry-run] npm add @lattice-ui/style@latest"));
    expect(logger.step).toHaveBeenCalledWith("No files were changed.");
    expect(logger.step).toHaveBeenCalledWith("npx lattice doctor");
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

    expect(logger.kv).toHaveBeenCalledWith("Selected", "10");
    expect(logger.step).toHaveBeenCalledWith("...and 2 more");
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
          style: { npm: "@lattice-ui/style" },
        },
        presets: {},
      },
    });

    await runUpgradeCommand(ctx, { names: ["style"], presets: [] });

    expect(logger.section).toHaveBeenCalledWith("Result");
    expect(logger.warn).toHaveBeenCalledWith("No installed @lattice-ui/* package matched upgrade selection.");
    expect(logger.section).toHaveBeenCalledWith("Next Steps");
    expect(logger.step).toHaveBeenCalledWith("npx lattice doctor");
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

    expect(logger.section).toHaveBeenCalledWith("Checking");
    expect(logger.section).toHaveBeenCalledWith("Recommended Commands");
    expect(logger.list).toHaveBeenCalledWith(expect.arrayContaining(["pnpm lattice add <component>"]));
  });

  it("doctor ignores @lattice-ui/cli as a tooling package", async () => {
    const dir = await createTempDir();
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify(
        {
          name: "tmp",
          devDependencies: {
            "@lattice-ui/cli": "^0.3.1",
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

    const listCalls = (logger.list as unknown as { mock: { calls: Array<[string[]]> } }).mock.calls;
    const listedMessages = listCalls.flatMap((call) => call[0]);

    expect(listedMessages).not.toContain("@lattice-ui/cli is installed but not found in CLI registry.");
    expect(listedMessages).toContain("No @lattice-ui component packages are installed.");
  });

  it("doctor throws on required provider errors but not warnings", async () => {
    const dir = await createTempDir();
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify(
        {
          name: "tmp",
          dependencies: {
            "@lattice-ui/popover": "^0.1.0",
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
            npm: "@lattice-ui/popover",
            peers: ["@rbxts/react", "@rbxts/react-roblox"],
            providers: ["@lattice-ui/layer:PortalProvider?"],
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
            npm: "@lattice-ui/popover",
            peers: ["@rbxts/react", "@rbxts/react-roblox"],
            providers: ["@lattice-ui/layer:PortalProvider"],
          },
        },
        presets: {},
      },
    });

    await expect(runDoctorCommand(errorCtx)).rejects.toThrow(/doctor found/i);
    expect(warningCtx.logger.section).toHaveBeenCalledWith("Summary");
  });
});
