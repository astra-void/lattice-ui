import * as path from "node:path";
import { registryInvalidError } from "../errors";
import { readJsonFile } from "../fs/json";
import { type Registry, validateRegistry } from "./schema";

export function resolveRegistryDir(baseDir = __dirname): string {
  return path.resolve(baseDir, "../../../registry");
}

export async function loadRegistry(registryDir = resolveRegistryDir()): Promise<Registry> {
  const componentsPath = path.join(registryDir, "components.json");
  const presetsPath = path.join(registryDir, "presets.json");

  try {
    const componentsSource = await readJsonFile(componentsPath);
    const presetsSource = await readJsonFile(presetsPath);
    return validateRegistry(componentsSource, presetsSource);
  } catch (error) {
    if (error instanceof Error) {
      throw registryInvalidError(`Failed to load registry: ${error.message}`, error);
    }

    throw registryInvalidError("Failed to load registry.", error);
  }
}
