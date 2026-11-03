import { EventEmitter } from "node:events";
import * as os from "node:os";
import { afterEach, describe, expect, it, vi } from "vitest";

const spawnMock = vi.hoisted(() => vi.fn());

vi.mock("node:child_process", () => ({ spawn: spawnMock }));

import { detectInstalledPackageManagers } from "../../../packages/tools/cli/src/core/pm/detect";

afterEach(() => {
  spawnMock.mockReset();
});

describe("detectInstalledPackageManagers", () => {
  it("probes each manager from a neutral directory instead of the user's project", async () => {
    spawnMock.mockImplementation(() => {
      const child = new EventEmitter();
      queueMicrotask(() => child.emit("close", 0));
      return child;
    });

    const installed = await detectInstalledPackageManagers();

    expect(installed).toEqual(["npm", "pnpm", "yarn"]);
    expect(spawnMock).toHaveBeenCalledTimes(3);
    for (const call of spawnMock.mock.calls) {
      expect(call[1]).toEqual(["--version"]);
      expect(call[2]).toMatchObject({ cwd: os.tmpdir() });
    }
  });
});
