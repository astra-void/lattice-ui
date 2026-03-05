import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runAddCommand } from "../../../packages/cli/src/commands/add";
import { runCreateCommand } from "../../../packages/cli/src/commands/create";
import { runDoctorCommand } from "../../../packages/cli/src/commands/doctor";
import { runUpgradeCommand } from "../../../packages/cli/src/commands/upgrade";
import type { Logger } from "../../../packages/cli/src/core/logger";
import type { PackageManager } from "../../../packages/cli/src/core/pm/types";
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
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    expect(packageJson.dependencies["@rbxts/react"]).toBe("9.9.9");
    expect(packageJson.dependencies["@rbxts/react-roblox"]).toBe("9.9.9");
    expect(packageJson.dependencies["@lattice-ui/style"]).toBe("9.9.9");
    expect(packageJson.devDependencies["roblox-ts"]).toBe("9.9.9");
    expect(install).toHaveBeenCalledWith(projectRoot);
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
  });
});
