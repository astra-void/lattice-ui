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

function stripJsonComments(content: string): string {
  let output = "";
  let inString = false;
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = 0; index < content.length; index += 1) {
    const current = content[index];
    const next = content[index + 1];

    if (inLineComment) {
      if (current === "\n") {
        inLineComment = false;
        output += current;
      }
      continue;
    }

    if (inBlockComment) {
      if (current === "*" && next === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (inString) {
      output += current;
      if (escaped) {
        escaped = false;
        continue;
      }

      if (current === "\\") {
        escaped = true;
        continue;
      }

      if (current === '"') {
        inString = false;
      }
      continue;
    }

    if (current === "/" && next === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (current === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }

    output += current;
    if (current === '"') {
      inString = true;
    }
  }

  return output;
}

function stripTrailingCommas(content: string): string {
  let output = "";
  let inString = false;
  let escaped = false;

  for (let index = 0; index < content.length; index += 1) {
    const current = content[index];

    if (inString) {
      output += current;
      if (escaped) {
        escaped = false;
        continue;
      }

      if (current === "\\") {
        escaped = true;
        continue;
      }

      if (current === '"') {
        inString = false;
      }
      continue;
    }

    if (current === '"') {
      inString = true;
      output += current;
      continue;
    }

    if (current !== ",") {
      output += current;
      continue;
    }

    let lookahead = index + 1;
    while (lookahead < content.length && /\s/.test(content[lookahead])) {
      lookahead += 1;
    }

    if (content[lookahead] === "}" || content[lookahead] === "]") {
      continue;
    }

    output += current;
  }

  return output;
}

export function parseJsonText<T = unknown>(content: string): T {
  const withoutComments = stripJsonComments(content);
  const normalized = stripTrailingCommas(withoutComments);
  return JSON.parse(normalized) as T;
}

export async function readJsonFile<T = unknown>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, "utf8");
  return parseJsonText<T>(content);
}

export async function writeJsonFile(filePath: string, value: unknown, stable = true): Promise<void> {
  const normalized = stable ? sortValue(value) : value;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
}
