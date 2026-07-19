import * as path from "node:path";
import { writeJsonFile } from "../fs/json";
import type { PackageJson } from "./readPackageJson";

export async function writePackageJson(projectRoot: string, manifest: PackageJson): Promise<void> {
  await writeJsonFile(path.join(projectRoot, "package.json"), manifest, false);
}
