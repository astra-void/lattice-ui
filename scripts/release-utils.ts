const SEMVER_NUMERIC_IDENTIFIER = "(?:0|[1-9]\\d*)";
const SEMVER_NON_NUMERIC_IDENTIFIER = "(?:\\d*[A-Za-z-][0-9A-Za-z-]*)";
const SEMVER_PRERELEASE_IDENTIFIER = `(?:${SEMVER_NUMERIC_IDENTIFIER}|${SEMVER_NON_NUMERIC_IDENTIFIER})`;
const SEMVER_PRERELEASE = `${SEMVER_PRERELEASE_IDENTIFIER}(?:\\.${SEMVER_PRERELEASE_IDENTIFIER})*`;

export const RELEASE_TAG_PATTERN = new RegExp(
  `^v(?<version>${SEMVER_NUMERIC_IDENTIFIER}\\.${SEMVER_NUMERIC_IDENTIFIER}\\.${SEMVER_NUMERIC_IDENTIFIER}(?:-(?<prerelease>${SEMVER_PRERELEASE}))?)$`,
);

export interface ParsedReleaseTag {
  tag: string;
  version: string;
  prerelease: string | null;
  distTag: string | null;
}

export interface ReleasePackageVersionInfo {
  name: string;
  version?: string;
  private?: boolean;
}

export function parseReleaseTag(tag: string): ParsedReleaseTag | null {
  const match = RELEASE_TAG_PATTERN.exec(tag);
  if (!match?.groups?.version) {
    return null;
  }

  const prerelease = match.groups.prerelease ?? null;
  return {
    tag,
    version: match.groups.version,
    prerelease,
    distTag: prerelease?.split(".")[0] ?? null,
  };
}

export function resolveReleaseTag(tag: string): ParsedReleaseTag {
  const parsed = parseReleaseTag(tag);
  if (!parsed) {
    throw new Error(`Invalid release tag "${tag}". Expected vX.Y.Z or vX.Y.Z-prerelease without build metadata.`);
  }

  return parsed;
}

export function validatePackageVersionMatchesRelease(
  tag: string,
  packageVersion: string,
  packageName = "package",
): ParsedReleaseTag {
  const parsed = resolveReleaseTag(tag);
  if (packageVersion !== parsed.version) {
    throw new Error(`${packageName} version ${packageVersion} does not match release tag ${tag}.`);
  }

  return parsed;
}

export function validateReleasePackageVersions(
  tag: string,
  packages: readonly ReleasePackageVersionInfo[],
): ParsedReleaseTag {
  const parsed = resolveReleaseTag(tag);
  const mismatches = packages
    .filter((pkg) => !pkg.private)
    .flatMap((pkg) => {
      if (!pkg.version) {
        return [`${pkg.name} is missing a version.`];
      }

      if (pkg.version !== parsed.version) {
        return [`${pkg.name} version ${pkg.version} does not match release tag ${tag}.`];
      }

      return [];
    });

  if (mismatches.length > 0) {
    throw new Error(mismatches.join("\n"));
  }

  return parsed;
}
