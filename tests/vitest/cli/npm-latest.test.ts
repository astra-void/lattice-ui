import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseNpmrc, resolveLatestVersions } from "../../../packages/tools/cli/src/core/npm/latest";

const tempDirs: string[] = [];

async function createTempDir() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "lattice-cli-latest-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

function stubFetch(version = "1.2.3") {
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify({ version })));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** A home directory with no `.npmrc`, so the developer's own config never leaks into a test. */
async function isolatedOptions(cwd: string, env: NodeJS.ProcessEnv = {}) {
  const homeDir = await createTempDir();
  return { cwd, env, homeDir };
}

describe("parseNpmrc", () => {
  it("reads keys, skips comments and expands environment variables", () => {
    const config = parseNpmrc(
      [
        "# comment",
        "; also a comment",
        "registry = https://mirror.example/npm/",
        "//mirror.example/npm/:_authToken=${TOKEN}",
      ].join("\n"),
      { TOKEN: "secret" },
    );

    expect(config.get("registry")).toBe("https://mirror.example/npm/");
    expect(config.get("//mirror.example/npm/:_authToken")).toBe("secret");
  });
});

describe("resolveLatestVersions", () => {
  it("defaults to the public npm registry", async () => {
    const dir = await createTempDir();
    const fetchMock = stubFetch();

    await resolveLatestVersions(["@lattice-ui/react-dialog"], await isolatedOptions(dir));

    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://registry.npmjs.org/@lattice-ui%2freact-dialog/latest");
  });

  it("honours npm_config_registry over .npmrc", async () => {
    const dir = await createTempDir();
    await writeFile(path.join(dir, ".npmrc"), "registry=https://ignored.example/\n", "utf8");
    const fetchMock = stubFetch();

    await resolveLatestVersions(
      ["roblox-ts"],
      await isolatedOptions(dir, { npm_config_registry: "https://env.example/npm" }),
    );

    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://env.example/npm/roblox-ts/latest");
  });

  it("reads a parent .npmrc, scoped registries and their auth token", async () => {
    const dir = await createTempDir();
    const project = path.join(dir, "packages", "game");
    await mkdir(project, { recursive: true });
    await writeFile(
      path.join(dir, ".npmrc"),
      [
        "registry=https://mirror.example/",
        "@lattice-ui:registry=https://private.example/npm/",
        "//private.example/npm/:_authToken=${LATTICE_TOKEN}",
      ].join("\n"),
      "utf8",
    );
    const fetchMock = stubFetch();

    const versions = await resolveLatestVersions(
      ["@lattice-ui/react-style", "typescript"],
      await isolatedOptions(project, { LATTICE_TOKEN: "abc" }),
    );

    expect(versions).toEqual({ "@lattice-ui/react-style": "1.2.3", typescript: "1.2.3" });
    const calls = fetchMock.mock.calls.map(([url, init]) => [
      url,
      (init?.headers as Record<string, string>).Authorization,
    ]);
    expect(calls).toEqual([
      ["https://private.example/npm/@lattice-ui%2freact-style/latest", "Bearer abc"],
      ["https://mirror.example/typescript/latest", undefined],
    ]);
  });

  it("reports the URL that failed", async () => {
    const dir = await createTempDir();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 503 })),
    );

    await expect(
      resolveLatestVersions(
        ["roblox-ts"],
        await isolatedOptions(dir, { npm_config_registry: "https://down.example/" }),
      ),
    ).rejects.toThrow("https://down.example/roblox-ts/latest responded with 503");
  });

  it("names the URL and the proxy caveat when the request cannot be made", async () => {
    const dir = await createTempDir();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );

    await expect(
      resolveLatestVersions(["roblox-ts"], await isolatedOptions(dir, { HTTPS_PROXY: "http://proxy.example:8080" })),
    ).rejects.toMatchObject({
      message: "Failed to fetch latest version for roblox-ts from https://registry.npmjs.org/roblox-ts/latest.",
      hints: [expect.stringContaining("NODE_USE_ENV_PROXY")],
    });
  });
});
