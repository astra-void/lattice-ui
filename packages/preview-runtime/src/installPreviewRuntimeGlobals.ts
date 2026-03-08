import { Enum } from "./Enum";
import { RunService } from "./RunService";
import { task } from "./task";

export interface PreviewRuntimeGlobalTarget {
  Enum?: typeof Enum;
  RunService?: typeof RunService;
  task?: typeof task;
}

export function installPreviewRuntimeGlobals(
  target: PreviewRuntimeGlobalTarget = globalThis as PreviewRuntimeGlobalTarget,
) {
  if (target.Enum === undefined) {
    target.Enum = Enum;
  }

  if (target.RunService === undefined) {
    target.RunService = RunService;
  }

  if (target.task === undefined) {
    target.task = task;
  }

  return target;
}

export default installPreviewRuntimeGlobals;
