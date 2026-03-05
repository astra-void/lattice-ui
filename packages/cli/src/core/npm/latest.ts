import { packageManagerFailedError } from "../errors";

interface LatestPackageMeta {
  version?: string;
}

const LATEST_TIMEOUT_MS = 10_000;

async function fetchLatestVersion(packageName: string): Promise<string> {
  const encodedName = encodeURIComponent(packageName);
  const url = `https://registry.npmjs.org/${encodedName}/latest`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(LATEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw packageManagerFailedError(`Failed to fetch latest version for ${packageName}.`, error);
  }

  if (!response.ok) {
    throw packageManagerFailedError(
      `Failed to fetch latest version for ${packageName}: npm registry responded with ${response.status}.`,
    );
  }

  let payload: LatestPackageMeta;
  try {
    payload = (await response.json()) as LatestPackageMeta;
  } catch (error) {
    throw packageManagerFailedError(`Failed to parse npm registry response for ${packageName}.`, error);
  }

  if (typeof payload.version !== "string" || payload.version.length === 0) {
    throw packageManagerFailedError(`npm registry did not return a valid latest version for ${packageName}.`);
  }

  return payload.version;
}

export async function resolveLatestVersions(packages: string[]): Promise<Record<string, string>> {
  const uniquePackages = [...new Set(packages)];
  const entries = await Promise.all(
    uniquePackages.map(async (packageName) => [packageName, await fetchLatestVersion(packageName)] as const),
  );

  return Object.fromEntries(entries);
}
