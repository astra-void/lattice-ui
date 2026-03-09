import { Enum } from "./Enum";
import { installPreviewRuntimeGlobals } from "./installPreviewRuntimeGlobals";
import { RunService } from "./RunService";
import { task } from "./task";

export interface SetupRobloxEnvironmentTarget {
  Enum?: typeof Enum;
  RunService?: typeof RunService;
  print?: (...args: unknown[]) => void;
  task?: typeof task;
  tostring?: (value: unknown) => string;
}

/**
 * Vite alias note:
 * - Alias broad packages such as `@rbxts/services` or `@flamework/core` to small local shim files.
 * - Re-export only the browser-safe members you need from this package in those shims.
 * - See `README.md` for concrete examples.
 */
export function setupRobloxEnvironment(
  target: SetupRobloxEnvironmentTarget = globalThis as SetupRobloxEnvironmentTarget,
) {
  const initializedTarget = installPreviewRuntimeGlobals(target);

  if (typeof window !== "undefined" && window !== target) {
    installPreviewRuntimeGlobals(window as Window & SetupRobloxEnvironmentTarget);
  }

  return initializedTarget;
}

export type { PreviewEnumCategory, PreviewEnumItem, PreviewEnumRoot } from "./Enum";
export { Enum } from "./Enum";
export { installPreviewRuntimeGlobals } from "./installPreviewRuntimeGlobals";
export type { PreviewPolyfillTarget } from "./polyfills";
export { installPreviewRuntimePolyfills } from "./polyfills";
export type { PreviewRunService, RBXScriptConnection, RBXScriptSignal } from "./RunService";
export { RunService } from "./RunService";
export type { TaskCallback, TaskLibrary } from "./task";
export { task } from "./task";
