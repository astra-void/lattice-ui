import { mkdtemp, rm, writeFile } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadRegistry } from "../../../packages/cli/src/core/registry/load";
import { validateRegistry } from "../../../packages/cli/src/core/registry/schema";

const tempDirs: string[] = [];

async function createRegistryDir() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "lattice-cli-registry-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("registry loading", () => {
  it("loads valid split registry files", async () => {
    const dir = await createRegistryDir();
    await writeFile(
      path.join(dir, "components.json"),
      JSON.stringify(
        {
          packages: {
            popover: {
              npm: "@lattice-ui/popover",
              peers: ["@rbxts/react", "@rbxts/react-roblox"],
              providers: ["@lattice-ui/layer:PortalProvider?"],
            },
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    await writeFile(
      path.join(dir, "presets.json"),
      JSON.stringify(
        {
          presets: {
            overlay: ["popover"],
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    const registry = await loadRegistry(dir);
    expect(registry.packages.popover.npm).toBe("@lattice-ui/popover");
    expect(registry.presets.overlay).toEqual(["popover"]);
  });

  it("fails when preset references unknown component", () => {
    expect(() =>
      validateRegistry(
        {
          packages: {
            style: { npm: "@lattice-ui/style" },
          },
        },
        {
          presets: {
            form: ["checkbox"],
          },
        },
      ),
    ).toThrow(/unknown component/i);
  });

  it("fails when package schema is invalid", () => {
    expect(() =>
      validateRegistry(
        {
          packages: {
            style: { npm: 3 },
          },
        },
        {
          presets: {},
        },
      ),
    ).toThrow(/must be a non-empty string/i);
  });
});
