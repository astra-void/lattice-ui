import { Enum } from "./Enum";
import { installPreviewRuntimeGlobals } from "./installPreviewRuntimeGlobals";
import { RunService } from "./RunService";
import { task } from "./task";

export interface SetupRobloxEnvironmentTarget {
  Enum?: typeof Enum;
  RunService?: typeof RunService;
  task?: typeof task;
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
export type { PreviewRunService, RBXScriptConnection, RBXScriptSignal } from "./RunService";
export { RunService } from "./RunService";
export type { TaskCallback, TaskLibrary } from "./task";
export { task } from "./task";
