import * as path from "node:path";
import { readJsonFile } from "../fs/json";

export type PackageJson = {
  name?: string;
  version?: string;
  private?: boolean;
  packageManager?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  [key: string]: unknown;
};

export async function readPackageJson(projectRoot: string): Promise<PackageJson> {
  return readJsonFile<PackageJson>(path.join(projectRoot, "package.json"));
}
