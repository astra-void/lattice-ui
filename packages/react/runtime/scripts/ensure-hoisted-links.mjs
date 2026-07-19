import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(scriptDir, "..");

// Walk up to the workspace root instead of assuming a fixed nesting depth,
// so packages can live at any level under packages/ (e.g. packages/react/motion).
function findWorkspaceRoot(startDir) {
  let current = startDir;
  while (true) {
    if (fs.existsSync(path.join(current, "pnpm-workspace.yaml"))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error(`Could not locate the workspace root above ${startDir}.`);
    }
    current = parent;
  }
}

const packageNodeModulesDir = path.join(packageDir, "node_modules");
const rootNodeModulesDir = path.join(findWorkspaceRoot(packageDir), "node_modules");
const scopedDirs = ["@rbxts", "@rbxts-js"];
const symlinkType = process.platform === "win32" ? "junction" : "dir";

fs.mkdirSync(packageNodeModulesDir, { recursive: true });

for (const scopedDir of scopedDirs) {
  const targetPath = path.join(rootNodeModulesDir, scopedDir);
  const linkPath = path.join(packageNodeModulesDir, scopedDir);

  if (!fs.existsSync(targetPath)) {
    continue;
  }

  let shouldRelink = true;
  if (fs.existsSync(linkPath)) {
    const current = fs.realpathSync(linkPath);
    const expected = fs.realpathSync(targetPath);
    shouldRelink = current !== expected;
  }

  if (!shouldRelink) {
    continue;
  }

  fs.rmSync(linkPath, { recursive: true, force: true });
  fs.symlinkSync(targetPath, linkPath, symlinkType);
}
