import { motionDrag, motionSettle } from "../core/tokens";
import { motionTargets, type ResponseMotionConfig } from "../core/types";

export function createIndicatorSettleRecipe(duration: number = motionSettle.selection): ResponseMotionConfig {
  return {
    target: motionTargets.sizeWrapper("indicator settle"),
    settle: { duration, tempo: "swift", tone: "responsive" },
  };
}

export function createSliderThumbResponseRecipe(
  isDragging: boolean,
  duration: number = isDragging ? motionDrag.active : motionDrag.idle,
): ResponseMotionConfig {
  return {
    target: motionTargets.layout("slider thumb"),
    settle: isDragging
      ? { duration, tempo: "instant", tone: "responsive" }
      : { duration, tempo: "swift", tone: "responsive" },
  };
}

export function createToggleResponseRecipe(duration: number = motionSettle.toggle): ResponseMotionConfig {
  return {
    target: motionTargets.layout("toggle response"),
    settle: { duration, tempo: "swift", tone: "responsive" },
  };
}

export function createSelectionResponseRecipe(duration: number = motionSettle.selection): ResponseMotionConfig {
  return {
    target: motionTargets.appearance("selection response"),
    settle: { duration, tempo: "swift", tone: "responsive" },
  };
}

export function createFieldResponseRecipe(duration: number = motionSettle.field): ResponseMotionConfig {
  return {
    target: motionTargets.appearance("field response"),
    settle: { duration, tempo: "swift", tone: "calm" },
  };
}

export function createProgressResponseRecipe(duration: number = motionSettle.progress): ResponseMotionConfig {
  return {
    target: motionTargets.layout("progress response"),
    settle: { duration, tempo: "swift", tone: "responsive" },
  };
}

export function createToastResponseRecipe(duration: number = motionSettle.toast): ResponseMotionConfig {
  return {
    target: motionTargets.appearance("toast response"),
    settle: { duration, tempo: "steady", tone: "calm" },
  };
}
