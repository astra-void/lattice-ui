import { Enum } from "./Enum";
import { RunService } from "./RunService";
import { installPreviewRuntimeGlobals } from "./installPreviewRuntimeGlobals";
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

export { Enum } from "./Enum";
export type { PreviewEnumCategory, PreviewEnumItem, PreviewEnumRoot } from "./Enum";
export { RunService } from "./RunService";
export type { PreviewRunService, RBXScriptConnection, RBXScriptSignal } from "./RunService";
export { installPreviewRuntimeGlobals } from "./installPreviewRuntimeGlobals";
export { task } from "./task";
export type { TaskCallback, TaskLibrary } from "./task";
