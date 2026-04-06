#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import {
  ensureDir,
  getInternalPackageNames,
  getLockedVersion,
  getPolicy,
  listApps,
  listPackages,
  normalizePackageManifest,
  ROOT_DIR,
  sortRecord,
  writeJson,
} from "./workspace-utils.ts";

function printUsage() {
  console.log(
    "Usage: pnpm package:new --name <kebab-name> [--deps <a,b>] [--app-link <none|playground|test-harness|both>]",
  );
}

function parseArgs(argv: string[]) {
  const parsed = {
    name: "",
    deps: "",
    appLink: "none",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--name") {
      parsed.name = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
    if (arg.startsWith("--name=")) {
      parsed.name = arg.slice("--name=".length);
      continue;
    }

    if (arg === "--deps") {
      parsed.deps = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
    if (arg.startsWith("--deps=")) {
      parsed.deps = arg.slice("--deps=".length);
      continue;
    }

    if (arg === "--app-link") {
      parsed.appLink = argv[index + 1] ?? "none";
      index += 1;
      continue;
    }
    if (arg.startsWith("--app-link=")) {
      parsed.appLink = arg.slice("--app-link=".length);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function normalizeInternalName(name: string) {
  if (!name) {
    return "";
  }
  return name.startsWith("@lattice-ui/") ? name : `@lattice-ui/${name}`;
}

function canonicalAppLink(value: string) {
  const normalized = value.trim();
  const allowed = new Set(["none", "playground", "test-harness", "both"]);
  if (!allowed.has(normalized)) {
    throw new Error(`Invalid --app-link value "${value}". Use none|playground|test-harness|both.`);
  }
  return normalized;
}

const args = parseArgs(process.argv.slice(2));
if (!args.name) {
  printUsage();
  process.exit(1);
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(args.name)) {
  throw new Error(`Invalid package name "${args.name}". Use kebab-case (a-z, 0-9, -).`);
}

const appLink = canonicalAppLink(args.appLink);
const packageName = `@lattice-ui/${args.name}`;
const packages = listPackages();
const apps = listApps();
const policy = getPolicy();

const existingPackageNames = getInternalPackageNames(packages);
if (existingPackageNames.has(packageName)) {
  throw new Error(`Package already exists: ${packageName}`);
}

const packageDir = `${ROOT_DIR}/packages/${args.name}`;
if (fs.existsSync(packageDir)) {
  throw new Error(`Directory already exists: ${packageDir}`);
}

const dependencyNames = [
  ...new Set(
    args.deps
      .split(",")
      .map((value) => normalizeInternalName(value.trim()))
      .filter(Boolean),
  ),
];

if (dependencyNames.includes(packageName)) {
  throw new Error("A package cannot depend on itself.");
}

for (const dependencyName of dependencyNames) {
  if (!existingPackageNames.has(dependencyName)) {
    throw new Error(`Unknown internal dependency: ${dependencyName}`);
  }
}

const lockedVersion = getLockedVersion(policy, packages);
const dependencySpec = policy.internalDependencyVersion ?? "workspace:*";
const defaultScripts = policy.packageDefaults?.scripts ?? {
  build: "rbxtsc -p tsconfig.json",
  watch: "rbxtsc -p tsconfig.json -w",
  typecheck: "tsc -p tsconfig.typecheck.json",
};
const defaultDevDependencies = policy.defaultDevDependencies ?? {};
const defaultPeerDependencies = policy.defaultPeerDependencies ?? {};

ensureDir(packageDir);
ensureDir(`${packageDir}/src`);

const packageManifest = normalizePackageManifest({
  name: packageName,
  version: lockedVersion,
  private: policy.packageDefaults?.private ?? false,
  main: policy.packageDefaults?.main ?? "out/init.luau",
  types: policy.packageDefaults?.types ?? "out/index.d.ts",
  source: policy.packageDefaults?.source ?? "src/index.ts",
  files: policy.packageDefaults?.files ?? ["default.project.json", "out", "src", "README.md"],
  repository: policy.packageDefaults?.repository,
  scripts: sortRecord({ ...defaultScripts }),
  dependencies:
    dependencyNames.length > 0
      ? sortRecord(Object.fromEntries(dependencyNames.map((dependencyName) => [dependencyName, dependencySpec])))
      : undefined,
  devDependencies: Object.keys(defaultDevDependencies).length > 0 ? sortRecord(defaultDevDependencies) : undefined,
  peerDependencies: Object.keys(defaultPeerDependencies).length > 0 ? sortRecord(defaultPeerDependencies) : undefined,
});

writeJson(`${packageDir}/package.json`, packageManifest);

writeJson(`${packageDir}/default.project.json`, {
  name: args.name,
  tree: {
    $path: "out",
    out: {
      $path: "out",
    },
  },
});

writeJson(`${packageDir}/tsconfig.json`, {
  extends: "../../tsconfig.base.json",
  compilerOptions: {
    rootDir: "src",
    outDir: "out",
    declaration: true,
    typeRoots: [
      "./node_modules/@rbxts",
      "../../node_modules/@rbxts",
      "./node_modules/@lattice-ui",
      "../../node_modules/@lattice-ui",
    ],
    types: ["types", "compiler-types"],
  },
  include: ["src"],
});

writeJson(`${packageDir}/tsconfig.typecheck.json`, {
  extends: "./tsconfig.json",
  compilerOptions: {
    noEmit: true,
    baseUrl: "..",
    rootDir: "..",
    paths: {},
  },
});

fs.writeFileSync(`${packageDir}/src/index.ts`, "export {};\n", "utf8");
fs.writeFileSync(
  `${packageDir}/README.md`,
  `# ${packageName}

Package scaffold generated by \`pnpm package:new\`.
`,
  "utf8",
);

const appsByDir = Object.fromEntries(apps.map((app) => [app.dirName, app]));
const linkedApps = appLink === "both" ? ["playground", "test-harness"] : appLink === "none" ? [] : [appLink];

for (const appKey of linkedApps) {
  const app = appsByDir[appKey];
  if (!app) {
    throw new Error(`Cannot link app "${appKey}" because it does not exist.`);
  }

  const appManifest = structuredClone(app.manifest);
  appManifest.dependencies = appManifest.dependencies ?? {};
  appManifest.dependencies[packageName] = dependencySpec;
  appManifest.dependencies = sortRecord(appManifest.dependencies);
  writeJson(app.manifestPath, appManifest);
}

const syncResult = spawnSync(process.execPath, ["--import", "tsx", "./scripts/workspace-sync.ts"], {
  cwd: ROOT_DIR,
  stdio: "inherit",
});

if (syncResult.status !== 0) {
  throw new Error("Failed to run workspace sync after package creation.");
}

console.log(`Created package: ${packageName}`);
if (linkedApps.length > 0) {
  console.log(`Linked in apps: ${linkedApps.join(", ")}`);
}
console.log("Next steps:");
console.log("1. Implement package code in packages/<name>/src.");
console.log("2. Run pnpm workspace:check.");
console.log("3. Add a changeset for public changes with pnpm changeset:add.");
