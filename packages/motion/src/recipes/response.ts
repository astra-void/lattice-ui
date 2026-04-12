import { motionTargets, type ResponseMotionConfig } from "../core/types";

export function createIndicatorSettleRecipe(duration = 0.12): ResponseMotionConfig {
  return {
    target: motionTargets.sizeWrapper("indicator settle"),
    settle: { duration, tempo: "swift", tone: "responsive" },
  };
}

export function createSliderThumbResponseRecipe(
  isDragging: boolean,
  duration = isDragging ? 0.05 : 0.12,
): ResponseMotionConfig {
  return {
    target: motionTargets.layout("slider thumb"),
    settle: isDragging
      ? { duration, tempo: "instant", tone: "responsive" }
      : { duration, tempo: "swift", tone: "responsive" },
  };
}

export function createToggleResponseRecipe(duration = 0.15): ResponseMotionConfig {
  return {
    target: motionTargets.layout("toggle response"),
    settle: { duration, tempo: "steady", tone: "responsive" },
  };
}

export function createSelectionResponseRecipe(duration = 0.1): ResponseMotionConfig {
  return {
    target: motionTargets.appearance("selection response"),
    settle: { duration, tempo: "swift", tone: "responsive" },
  };
}

export function createFieldResponseRecipe(duration = 0.1): ResponseMotionConfig {
  return {
    target: motionTargets.appearance("field response"),
    settle: { duration, tempo: "swift", tone: "calm" },
  };
}

export function createProgressResponseRecipe(duration = 0.12): ResponseMotionConfig {
  return {
    target: motionTargets.layout("progress response"),
    settle: { duration, tempo: "swift", tone: "responsive" },
  };
}

export function createToastResponseRecipe(duration = 0.14): ResponseMotionConfig {
  return {
    target: motionTargets.appearance("toast response"),
    settle: { duration, tempo: "steady", tone: "calm" },
  };
}
