/**
 * Versions the CLI must never take from the npm `latest` dist-tag.
 *
 * roblox-ts depends on an exact `typescript` version and compiles with that copy, so a
 * project that installs a newer TypeScript type-checks against a compiler the build never
 * uses. `latest` also drifts past the `typescript` peer range of @typescript-eslint, which
 * makes npm refuse to install the lint preset at all.
 */
export const PINNED_VERSIONS: Record<string, string> = {
  typescript: "5.5.3",
};

export function isPinnedPackage(packageName: string): boolean {
  return PINNED_VERSIONS[packageName] !== undefined;
}

/** Drops pinned packages so they are never looked up on the registry. */
export function selectResolvablePackages(packages: string[]): string[] {
  return packages.filter((packageName) => !isPinnedPackage(packageName));
}

/** Pins win over anything a registry lookup produced. */
export function applyPinnedVersions(versions: Record<string, string>): Record<string, string> {
  return { ...versions, ...PINNED_VERSIONS };
}
