#!/usr/bin/env node

import * as fs from "node:fs";
import { getReleasePublishTagArgs, validateReleasePackageVersions } from "./release-utils";
import { listPackages } from "./workspace-utils";

interface CliOptions {
  tag: string;
  githubOutput?: string;
}

function parseArgs(argv: readonly string[]): CliOptions {
  let tag: string | undefined;
  let githubOutput: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--") {
      continue;
    }

    if (arg === "--tag") {
      tag = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--github-output") {
      githubOutput = argv[index + 1];
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument "${arg}".`);
  }

  if (!tag) {
    throw new Error("Missing required --tag <release-tag> argument.");
  }

  return { tag, githubOutput };
}

function appendGithubOutput(outputPath: string, name: string, value: string): void {
  fs.appendFileSync(outputPath, `${name}=${value}\n`, "utf8");
}

const { tag, githubOutput } = parseArgs(process.argv.slice(2));

const parsed = validateReleasePackageVersions(
  tag,
  listPackages().map((pkg) => ({
    name: pkg.manifest.name,
    version: pkg.manifest.version,
    private: pkg.manifest.private,
  })),
);

if (githubOutput) {
  appendGithubOutput(githubOutput, "release_tag", parsed.tag);
  appendGithubOutput(githubOutput, "release_version", parsed.version);
  appendGithubOutput(githubOutput, "npm_dist_tag", parsed.distTag ?? "");
  appendGithubOutput(githubOutput, "npm_publish_tag_args", getReleasePublishTagArgs(parsed));
}

if (parsed.distTag) {
  console.log(`Validated ${parsed.tag} against workspace package versions. npm dist-tag: ${parsed.distTag}`);
} else {
  console.log(`Validated ${parsed.tag} against workspace package versions. npm will use the default latest dist-tag.`);
}
