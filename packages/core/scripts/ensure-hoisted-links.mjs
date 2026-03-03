import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(scriptDir, "..");
const packageNodeModulesDir = path.join(packageDir, "node_modules");
const rootNodeModulesDir = path.resolve(packageDir, "../../node_modules");
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
