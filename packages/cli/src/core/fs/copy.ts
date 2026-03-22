import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { Logger } from "../logger";
import { parseJsonText, readJsonFile, writeJsonFile } from "./json";
import { mergeMissing } from "./patch";

export interface CopyTemplateOptions {
  dryRun: boolean;
  logger?: Logger;
  replacements?: Record<string, string>;
  shouldIncludeFile?: (relativePath: string) => boolean;
}

export interface CopyTemplateReport {
  created: string[];
  merged: string[];
  skipped: string[];
}

function applyReplacements(content: string, replacements: Record<string, string> | undefined): string {
  if (!replacements) {
    return content;
  }

  let next = content;
  for (const [from, to] of Object.entries(replacements)) {
    next = next.split(from).join(to);
  }

  return next;
}

function isJsonFile(filePath: string): boolean {
  return filePath.endsWith(".json");
}

function shouldPreserveJsonKeyOrder(relativePath: string): boolean {
  return relativePath === "package.json";
}

function resolveTargetRelativePath(relativePath: string): string {
  return relativePath.endsWith(".template") ? relativePath.slice(0, -".template".length) : relativePath;
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(root: string): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(absolutePath)));
      continue;
    }

    files.push(absolutePath);
  }

  return files;
}

export async function copyTemplateSafe(
  templateDir: string,
  targetDir: string,
  options: CopyTemplateOptions,
): Promise<CopyTemplateReport> {
  const files = await walkFiles(templateDir);
  const report: CopyTemplateReport = {
    created: [],
    merged: [],
    skipped: [],
  };

  for (const templateFilePath of files) {
    const relativePath = resolveTargetRelativePath(path.relative(templateDir, templateFilePath));
    if (options.shouldIncludeFile && !options.shouldIncludeFile(relativePath)) {
      continue;
    }

    const targetFilePath = path.join(targetDir, relativePath);
    const exists = await pathExists(targetFilePath);

    if (!exists) {
      if (!options.dryRun) {
        const raw = await fs.readFile(templateFilePath, "utf8");
        const content = applyReplacements(raw, options.replacements);
        await fs.mkdir(path.dirname(targetFilePath), { recursive: true });
        await fs.writeFile(targetFilePath, content, "utf8");
      }

      report.created.push(relativePath);
      continue;
    }

    if (!isJsonFile(relativePath)) {
      report.skipped.push(relativePath);
      continue;
    }

    const templateRaw = await fs.readFile(templateFilePath, "utf8");
    const templateJson = parseJsonText(applyReplacements(templateRaw, options.replacements)) as unknown;
    const currentJson = await readJsonFile<unknown>(targetFilePath);
    const mergedJson = mergeMissing(templateJson, currentJson);

    const mergedText = JSON.stringify(mergedJson);
    const currentText = JSON.stringify(currentJson);
    if (mergedText === currentText) {
      report.skipped.push(relativePath);
      continue;
    }

    if (!options.dryRun) {
      await writeJsonFile(targetFilePath, mergedJson, !shouldPreserveJsonKeyOrder(relativePath));
    }

    report.merged.push(relativePath);
  }

  if (options.logger?.verbose) {
    options.logger.debug(
      `Template copy report: created=${report.created.length}, merged=${report.merged.length}, skipped=${report.skipped.length}`,
    );
  }

  return report;
}
