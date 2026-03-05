import { promises as fs } from "node:fs";
import * as path from "node:path";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortValue(item));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));
  return Object.fromEntries(entries.map(([key, item]) => [key, sortValue(item)]));
}

export async function readJsonFile<T = unknown>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content) as T;
}

export async function writeJsonFile(filePath: string, value: unknown, stable = true): Promise<void> {
  const normalized = stable ? sortValue(value) : value;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
}
