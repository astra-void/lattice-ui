import { describe, expect, it } from "vitest";
import {
  getReleasePublishTagArgs,
  parseReleaseTag,
  resolveReleaseTag,
  validatePackageVersionMatchesRelease,
  validateReleasePackageVersions,
} from "../../../scripts/release-utils";

describe("release tag validation", () => {
  it("keeps stable release tags valid", () => {
    expect(resolveReleaseTag("v0.1.0")).toEqual({
      tag: "v0.1.0",
      version: "0.1.0",
      prerelease: null,
      distTag: null,
    });
  });

  it("accepts prerelease tags and preserves the full package version", () => {
    expect(validatePackageVersionMatchesRelease("v0.1.0-alpha.1", "0.1.0-alpha.1", "@lattice-ui/core")).toEqual({
      tag: "v0.1.0-alpha.1",
      version: "0.1.0-alpha.1",
      prerelease: "alpha.1",
      distTag: "alpha",
    });
  });

  it("fails when a prerelease tag does not match the package version", () => {
    expect(() => validatePackageVersionMatchesRelease("v0.1.0-alpha.1", "0.1.0-beta.1", "@lattice-ui/core")).toThrow(
      "@lattice-ui/core version 0.1.0-beta.1 does not match release tag v0.1.0-alpha.1.",
    );
  });

  it("derives dist-tags from the first prerelease identifier", () => {
    expect(parseReleaseTag("v0.1.0-alpha.1")?.distTag).toBe("alpha");
    expect(parseReleaseTag("v0.1.0-beta.2")?.distTag).toBe("beta");
    expect(parseReleaseTag("v0.1.0-rc.0")?.distTag).toBe("rc");
    expect(parseReleaseTag("v0.1.0")?.distTag).toBeNull();
  });

  it("derives publish tag args from parsed release metadata", () => {
    expect(getReleasePublishTagArgs(resolveReleaseTag("v0.1.0"))).toBe("");
    expect(getReleasePublishTagArgs(resolveReleaseTag("v0.1.0-alpha.1"))).toBe("--tag alpha");
    expect(getReleasePublishTagArgs(resolveReleaseTag("v0.1.0-beta.2"))).toBe("--tag beta");
  });

  it("validates all publishable package versions against prerelease tags", () => {
    expect(() =>
      validateReleasePackageVersions("v0.1.0-alpha.1", [
        { name: "@lattice-ui/core", version: "0.1.0-alpha.1" },
        { name: "@lattice-ui/radio-group", version: "0.1.0-alpha.1" },
        { name: "@lattice-ui/loom-preview", version: "0.1.0-alpha.2", private: true },
      ]),
    ).not.toThrow();
  });

  it("fails when any publishable package version diverges from the release tag", () => {
    expect(() =>
      validateReleasePackageVersions("v0.1.0-alpha.1", [
        { name: "@lattice-ui/core", version: "0.1.0-alpha.1" },
        { name: "@lattice-ui/radio-group", version: "0.1.0-alpha.2" },
      ]),
    ).toThrow("@lattice-ui/radio-group version 0.1.0-alpha.2 does not match release tag v0.1.0-alpha.1.");
  });
});
