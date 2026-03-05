import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runAddCommand } from "../../../packages/cli/src/commands/add";
import { runDoctorCommand } from "../../../packages/cli/src/commands/doctor";
import { runInitCommand } from "../../../packages/cli/src/commands/init";
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

function createContext(params: {
  projectRoot: string;
  registry: Registry;
  options?: Partial<CliContext["options"]>;
  pm?: Partial<PackageManager>;
  logger?: Logger;
  detectedLockfiles?: CliContext["detectedLockfiles"];
}): CliContext {
  const pm: PackageManager = {
    name: "npm",
    add: vi.fn(async () => undefined),
    remove: vi.fn(async () => undefined),
    install: vi.fn(async () => undefined),
    exec: vi.fn(async () => undefined),
    ...params.pm,
  };

  return {
    cwd: params.projectRoot,
    projectRoot: params.projectRoot,
    packageJsonPath: path.join(params.projectRoot, "package.json"),
    options: {
      cwd: params.projectRoot,
      pm: undefined,
      verbose: false,
      dryRun: false,
      yes: true,
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
  it("init --dry-run does not create files", async () => {
    const dir = await createTempDir();

    const ctx = createContext({
      projectRoot: dir,
      options: { dryRun: true },
      registry: { packages: {}, presets: {} },
    });

    await runInitCommand(ctx);

    await expect(readFile(path.join(dir, "package.json"), "utf8")).rejects.toThrow();
    expect(ctx.pm.install).not.toHaveBeenCalled();
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
