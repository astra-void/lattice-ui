import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { packageManagerFailedError } from "../errors";

interface LatestPackageMeta {
  version?: string;
}

const LATEST_TIMEOUT_MS = 10_000;
const DEFAULT_REGISTRY = "https://registry.npmjs.org/";

export interface ResolveLatestVersionsOptions {
  /** Where to start looking for project `.npmrc` files. Defaults to the process cwd. */
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  homeDir?: string;
}

export interface RegistryTarget {
  /** Registry base URL, always ending in `/`. */
  registry: string;
  authToken?: string;
}

type NpmConfig = Map<string, string>;

/** `${VAR}` expands from the environment, as npm does; an unset variable leaves the text as is. */
function expandEnv(value: string, env: NodeJS.ProcessEnv): string {
  return value.replace(/\$\{([^}?]+)\??\}/g, (match, name: string) => env[name] ?? match);
}

export function parseNpmrc(content: string, env: NodeJS.ProcessEnv = {}): NpmConfig {
  const config: NpmConfig = new Map();

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith("#") || line.startsWith(";")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator <= 0) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (value.length >= 2 && (value[0] === '"' || value[0] === "'") && value.endsWith(value[0])) {
      value = value.slice(1, -1);
    }

    config.set(expandEnv(key, env), expandEnv(value, env));
  }

  return config;
}

async function readNpmrc(filePath: string, env: NodeJS.ProcessEnv): Promise<NpmConfig | undefined> {
  try {
    return parseNpmrc(await fs.readFile(filePath, "utf8"), env);
  } catch {
    return undefined;
  }
}

/**
 * Config layers, highest precedence first: `npm_config_*` environment variables, project `.npmrc`
 * files from `cwd` upwards (which covers a workspace root's `.npmrc`), then the user config.
 */
async function loadNpmConfig(options: ResolveLatestVersionsOptions): Promise<NpmConfig[]> {
  const env = options.env ?? process.env;
  const layers: NpmConfig[] = [];

  const envLayer: NpmConfig = new Map();
  for (const [name, value] of Object.entries(env)) {
    if (value !== undefined && /^npm_config_/i.test(name)) {
      // npm's own mapping: `npm_config_foo_bar` is the `foo-bar` key.
      envLayer.set(
        name
          .slice("npm_config_".length)
          .replace(/(?!^)_/g, "-")
          .toLowerCase(),
        value,
      );
    }
  }
  layers.push(envLayer);

  const visited = new Set<string>();
  let currentDir = path.resolve(options.cwd ?? process.cwd());
  while (true) {
    const filePath = path.join(currentDir, ".npmrc");
    visited.add(filePath);
    const layer = await readNpmrc(filePath, env);
    if (layer) {
      layers.push(layer);
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  const userConfig = env.npm_config_userconfig ?? env.NPM_CONFIG_USERCONFIG;
  const userPath = path.resolve(userConfig ?? path.join(options.homeDir ?? os.homedir(), ".npmrc"));
  if (!visited.has(userPath)) {
    const layer = await readNpmrc(userPath, env);
    if (layer) {
      layers.push(layer);
    }
  }

  return layers;
}

function lookup(layers: NpmConfig[], key: string): string | undefined {
  for (const layer of layers) {
    const value = layer.get(key);
    if (value !== undefined && value.length > 0) {
      return value;
    }
  }

  return undefined;
}

function withTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

/** The registry a package resolves from: its scope's `@scope:registry`, then `registry`. */
export function resolveRegistryTarget(packageName: string, layers: NpmConfig[]): RegistryTarget {
  const scope = packageName.startsWith("@") ? packageName.slice(0, packageName.indexOf("/")) : undefined;
  const registry = withTrailingSlash(
    (scope ? lookup(layers, `${scope}:registry`) : undefined) ?? lookup(layers, "registry") ?? DEFAULT_REGISTRY,
  );

  // npm keys credentials by the registry URL without its protocol, e.g. `//npm.example.com/:_authToken`.
  const nerfDart = registry.replace(/^[a-z]+:/i, "");
  const authToken = lookup(layers, `${nerfDart}:_authToken`);

  return { registry, authToken };
}

/** `@scope/name` → `@scope%2fname`, the form registries (and npm itself) expect in a path. */
function escapePackageName(packageName: string): string {
  return packageName.replace("/", "%2f");
}

function proxyHint(env: NodeJS.ProcessEnv): string[] {
  const proxy = env.HTTPS_PROXY ?? env.https_proxy ?? env.HTTP_PROXY ?? env.http_proxy;
  if (proxy === undefined || env.NODE_USE_ENV_PROXY === "1") {
    return [];
  }

  return ["Node's built-in fetch ignores HTTPS_PROXY unless NODE_USE_ENV_PROXY=1 is set (recent Node versions)."];
}

async function fetchLatestVersion(packageName: string, layers: NpmConfig[], env: NodeJS.ProcessEnv): Promise<string> {
  const target = resolveRegistryTarget(packageName, layers);
  const url = `${target.registry}${escapePackageName(packageName)}/latest`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(target.authToken ? { Authorization: `Bearer ${target.authToken}` } : {}),
      },
      signal: AbortSignal.timeout(LATEST_TIMEOUT_MS),
    });
  } catch (error) {
    const failure = packageManagerFailedError(`Failed to fetch latest version for ${packageName} from ${url}.`, error);
    failure.hints.push(...proxyHint(env));
    throw failure;
  }

  if (!response.ok) {
    throw packageManagerFailedError(
      `Failed to fetch latest version for ${packageName}: ${url} responded with ${response.status}.`,
    );
  }

  let payload: LatestPackageMeta;
  try {
    payload = (await response.json()) as LatestPackageMeta;
  } catch (error) {
    throw packageManagerFailedError(`Failed to parse the registry response from ${url}.`, error);
  }

  if (typeof payload.version !== "string" || payload.version.length === 0) {
    throw packageManagerFailedError(`${url} did not return a valid latest version for ${packageName}.`);
  }

  return payload.version;
}

/**
 * Looks up each package's `latest` dist-tag on the registry the project is configured for
 * (`npm_config_registry`, `.npmrc`, scoped registries and their `_authToken`), not a hardcoded
 * registry.npmjs.org.
 */
export async function resolveLatestVersions(
  packages: string[],
  options: ResolveLatestVersionsOptions = {},
): Promise<Record<string, string>> {
  const env = options.env ?? process.env;
  const layers = await loadNpmConfig(options);
  const uniquePackages = [...new Set(packages)];
  const entries = await Promise.all(
    uniquePackages.map(
      async (packageName) => [packageName, await fetchLatestVersion(packageName, layers, env)] as const,
    ),
  );

  return Object.fromEntries(entries);
}
