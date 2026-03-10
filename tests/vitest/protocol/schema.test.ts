import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createPreviewHeadlessSession } from "../../../packages/preview/src/headless";
import { createPreviewEngine } from "../../../packages/preview-engine/src/engine";
import {
  createEmptyLayoutDebugPayload,
  type PreviewLayoutDebugPayload,
} from "../../../packages/preview-runtime/src/layout/model";
import { ModuleLoadError } from "../../../packages/preview-runtime/src/runtime/runtimeError";

type JsonSchema = {
  $defs?: Record<string, JsonSchema>;
  $ref?: string;
  additionalProperties?: boolean | JsonSchema;
  anyOf?: JsonSchema[];
  const?: unknown;
  enum?: unknown[];
  items?: JsonSchema;
  minimum?: number;
  minItems?: number;
  oneOf?: JsonSchema[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  type?: string | string[];
};

const temporaryRoots: string[] = [];
const workspaceRoot = path.resolve(__dirname, "../../..");

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    fs.rmSync(root, { force: true, recursive: true });
  }
});

function createTempPackage() {
  const packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lattice-preview-schema-"));
  temporaryRoots.push(packageRoot);
  fs.mkdirSync(path.join(packageRoot, "src"), { recursive: true });
  fs.writeFileSync(path.join(packageRoot, "package.json"), JSON.stringify({ name: "@fixtures/schema" }, null, 2));
  fs.writeFileSync(
    path.join(packageRoot, "src", "Button.tsx"),
    `
      export function ButtonPreview() {
        return <frame />;
      }

      export const preview = {
        entry: ButtonPreview,
        title: "Button Preview",
      };
    `,
    "utf8",
  );

  return {
    packageRoot,
    sourceRoot: path.join(packageRoot, "src"),
  };
}

function readJsonFile<T>(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "")) as T;
}

function toJsonValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function resolveSchemaRef(schemaRoot: JsonSchema, ref: string) {
  if (!ref.startsWith("#/")) {
    throw new Error(`Unsupported schema ref: ${ref}`);
  }

  const segments = ref.slice(2).split("/");
  let current: unknown = schemaRoot;
  for (const segment of segments) {
    if (!current || typeof current !== "object" || !(segment in current)) {
      throw new Error(`Unable to resolve schema ref: ${ref}`);
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return current as JsonSchema;
}

function matchesJsonType(value: unknown, expectedType: string) {
  switch (expectedType) {
    case "array":
      return Array.isArray(value);
    case "boolean":
      return typeof value === "boolean";
    case "integer":
      return typeof value === "number" && Number.isInteger(value);
    case "null":
      return value === null;
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "object":
      return typeof value === "object" && value !== null && !Array.isArray(value);
    case "string":
      return typeof value === "string";
    default:
      throw new Error(`Unsupported JSON schema type: ${expectedType}`);
  }
}

function validateAgainstSchema(
  value: unknown,
  schema: JsonSchema,
  schemaRoot: JsonSchema,
  currentPath = "$",
): string[] {
  if (schema.$ref) {
    return validateAgainstSchema(value, resolveSchemaRef(schemaRoot, schema.$ref), schemaRoot, currentPath);
  }

  if (schema.const !== undefined && value !== schema.const) {
    return [`${currentPath} must equal ${JSON.stringify(schema.const)}`];
  }

  if (schema.enum && !schema.enum.some((candidate) => candidate === value)) {
    return [`${currentPath} must be one of ${JSON.stringify(schema.enum)}`];
  }

  if (schema.anyOf) {
    const candidateErrors = schema.anyOf.map((candidate) =>
      validateAgainstSchema(value, candidate, schemaRoot, currentPath),
    );
    if (!candidateErrors.some((errors) => errors.length === 0)) {
      return [`${currentPath} must satisfy at least one schema variant`];
    }
    return [];
  }

  if (schema.oneOf) {
    const matches = schema.oneOf.filter(
      (candidate) => validateAgainstSchema(value, candidate, schemaRoot, currentPath).length === 0,
    );
    if (matches.length !== 1) {
      return [`${currentPath} must satisfy exactly one schema variant`];
    }
    return [];
  }

  if (schema.type) {
    const expectedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!expectedTypes.some((expectedType) => matchesJsonType(value, expectedType))) {
      return [`${currentPath} must be of type ${expectedTypes.join(" | ")}`];
    }
  }

  if (typeof schema.minimum === "number" && typeof value === "number" && value < schema.minimum) {
    return [`${currentPath} must be >= ${schema.minimum}`];
  }

  if (typeof schema.minItems === "number" && Array.isArray(value) && value.length < schema.minItems) {
    return [`${currentPath} must contain at least ${schema.minItems} items`];
  }

  if (Array.isArray(value) && schema.items) {
    return value.flatMap((item, index) =>
      validateAgainstSchema(item, schema.items as JsonSchema, schemaRoot, `${currentPath}[${index}]`),
    );
  }

  if (!Array.isArray(value) && value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const errors: string[] = [];

    for (const requiredKey of schema.required ?? []) {
      if (!(requiredKey in record)) {
        errors.push(`${currentPath}.${requiredKey} is required`);
      }
    }

    if (schema.properties) {
      for (const [propertyName, propertySchema] of Object.entries(schema.properties)) {
        if (propertyName in record) {
          errors.push(
            ...validateAgainstSchema(
              record[propertyName],
              propertySchema,
              schemaRoot,
              `${currentPath}.${propertyName}`,
            ),
          );
        }
      }
    }

    const allowedKeys = new Set(Object.keys(schema.properties ?? {}));
    for (const [propertyName, propertyValue] of Object.entries(record)) {
      if (allowedKeys.has(propertyName)) {
        continue;
      }

      if (schema.additionalProperties === false) {
        errors.push(`${currentPath}.${propertyName} is not allowed`);
        continue;
      }

      if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
        errors.push(
          ...validateAgainstSchema(
            propertyValue,
            schema.additionalProperties as JsonSchema,
            schemaRoot,
            `${currentPath}.${propertyName}`,
          ),
        );
      }
    }

    return errors;
  }

  return [];
}

function expectSchemaMatch(value: unknown, schemaPath: string) {
  const schema = readJsonFile<JsonSchema>(schemaPath);
  const jsonValue = toJsonValue(value);
  const errors = validateAgainstSchema(jsonValue, schema, schema);
  expect(errors).toEqual([]);
}

describe("public protocol schemas", () => {
  it("publishes strict preview-engine and preview-runtime schema artifacts", () => {
    const previewEnginePackageJson = readJsonFile<{
      exports: Record<string, string | Record<string, string>>;
      files: string[];
      version: string;
    }>(path.join(workspaceRoot, "packages/preview-engine/package.json"));
    const previewRuntimePackageJson = readJsonFile<{
      exports: Record<string, string | Record<string, string>>;
      files: string[];
      version: string;
    }>(path.join(workspaceRoot, "packages/preview-runtime/package.json"));

    expect(previewEnginePackageJson.version).toBe("0.4.0");
    expect(previewRuntimePackageJson.version).toBe("0.4.0");
    expect(previewEnginePackageJson.files).toContain("schemas");
    expect(previewRuntimePackageJson.files).toContain("schemas");
    expect(previewEnginePackageJson.exports).not.toHaveProperty("./compat");
    expect(previewEnginePackageJson.exports).toMatchObject({
      "./schemas/diagnostic": "./schemas/diagnostic.schema.json",
      "./schemas/entry-payload": "./schemas/entry-payload.schema.json",
      "./schemas/workspace-index": "./schemas/workspace-index.schema.json",
    });
    expect(previewRuntimePackageJson.exports).toMatchObject({
      "./schemas/layout-debug-payload": "./schemas/layout-debug-payload.schema.json",
      "./schemas/runtime-issue": "./schemas/runtime-issue.schema.json",
    });

    expect(fs.existsSync(path.join(workspaceRoot, "packages/preview-engine/schemas/workspace-index.schema.json"))).toBe(
      true,
    );
    expect(fs.existsSync(path.join(workspaceRoot, "packages/preview-engine/schemas/entry-payload.schema.json"))).toBe(
      true,
    );
    expect(fs.existsSync(path.join(workspaceRoot, "packages/preview-engine/schemas/diagnostic.schema.json"))).toBe(
      true,
    );
    expect(fs.existsSync(path.join(workspaceRoot, "packages/preview-runtime/schemas/runtime-issue.schema.json"))).toBe(
      true,
    );
    expect(
      fs.existsSync(path.join(workspaceRoot, "packages/preview-runtime/schemas/layout-debug-payload.schema.json")),
    ).toBe(true);
  });

  it("validates engine and headless payloads against the frozen preview schemas", async () => {
    const { packageRoot, sourceRoot } = createTempPackage();
    const packageName = "@fixtures/schema";
    const entryId = `${packageName}:Button.tsx`;
    const engine = createPreviewEngine({
      projectName: packageName,
      targets: [
        {
          name: packageName,
          packageName,
          packageRoot,
          sourceRoot,
        },
      ],
      transformMode: "strict-fidelity",
    });

    const workspaceIndex = engine.getWorkspaceIndex();
    const payload = engine.getEntryPayload(entryId);

    const session = await createPreviewHeadlessSession({ cwd: packageRoot });
    try {
      const snapshot = session.getSnapshot();
      expect(snapshot.workspaceIndex).toEqual(workspaceIndex);
      expect(snapshot.entries[entryId]).toEqual(payload);

      expectSchemaMatch(
        workspaceIndex,
        path.join(workspaceRoot, "packages/preview-engine/schemas/workspace-index.schema.json"),
      );
      expectSchemaMatch(payload, path.join(workspaceRoot, "packages/preview-engine/schemas/entry-payload.schema.json"));
      expectSchemaMatch(
        snapshot.workspaceIndex,
        path.join(workspaceRoot, "packages/preview-engine/schemas/workspace-index.schema.json"),
      );
      expectSchemaMatch(
        snapshot.entries[entryId],
        path.join(workspaceRoot, "packages/preview-engine/schemas/entry-payload.schema.json"),
      );
      expectSchemaMatch(
        payload.diagnostics[0] ?? {
          code: "NO_DIAGNOSTICS",
          entryId: payload.descriptor.id,
          file: payload.descriptor.sourceFilePath,
          phase: "discovery",
          relativeFile: payload.descriptor.relativePath,
          severity: "info",
          summary: "No diagnostics recorded.",
          target: payload.descriptor.targetName,
        },
        path.join(workspaceRoot, "packages/preview-engine/schemas/diagnostic.schema.json"),
      );
    } finally {
      session.dispose();
      engine.dispose();
    }
  });

  it("validates runtime issue and layout debug payload artifacts against the frozen runtime schemas", () => {
    const runtimeIssue = new ModuleLoadError({
      entryId: "fixture:Button.tsx",
      file: "/virtual/Button.tsx",
      relativeFile: "src/Button.tsx",
      summary: "Failed to load the preview runtime module.",
      target: "fixture",
    }).toIssue();

    const layoutDebugPayload: PreviewLayoutDebugPayload = {
      ...createEmptyLayoutDebugPayload({
        height: 240,
        width: 320,
      }),
      dirtyNodeIds: ["root", "text"],
      roots: [
        {
          children: [
            {
              children: [],
              id: "text",
              intrinsicSize: {
                height: 20,
                width: 80,
              },
              kind: "host",
              layoutSource: "intrinsic-size",
              nodeType: "TextLabel",
              parentConstraints: {
                height: 240,
                width: 320,
                x: 0,
                y: 0,
              },
              parentId: "root",
              provenance: {
                detail: "Measured from the DOM adapter.",
                source: "wasm",
              },
              rect: {
                height: 20,
                width: 80,
                x: 12,
                y: 16,
              },
              styleHints: {
                width: "80px",
              },
            },
          ],
          debugLabel: "Root",
          id: "root",
          intrinsicSize: null,
          kind: "root",
          layoutSource: "root-default",
          nodeType: "ScreenGui",
          parentConstraints: null,
          provenance: {
            detail: "Computed from viewport constraints.",
            source: "wasm",
          },
          rect: {
            height: 240,
            width: 320,
            x: 0,
            y: 0,
          },
        },
      ],
    };

    expectSchemaMatch(
      runtimeIssue,
      path.join(workspaceRoot, "packages/preview-runtime/schemas/runtime-issue.schema.json"),
    );
    expectSchemaMatch(
      layoutDebugPayload,
      path.join(workspaceRoot, "packages/preview-runtime/schemas/layout-debug-payload.schema.json"),
    );
  });
});
