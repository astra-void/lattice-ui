import { MOTION_TIMINGS } from "./timings";
import { getToggleTargetProps, getToggleOffsetTargetProps } from "../targets/toggle";
import type { MotionConfig } from "../runtime/types";

export function getToggleRecipe(onColor: Color3, offColor: Color3): MotionConfig {
  return {
    entering: {
      tweenInfo: MOTION_TIMINGS.enter,
      initial: getToggleTargetProps(offColor),
      goals: getToggleTargetProps(onColor),
    },
    entered: {
      goals: getToggleTargetProps(onColor),
    },
    exiting: {
      tweenInfo: MOTION_TIMINGS.exit,
      goals: getToggleTargetProps(offColor),
    },
  };
}

export function getToggleOffsetRecipe(onPosition: UDim2, offPosition: UDim2): MotionConfig {
  return {
    entering: {
      tweenInfo: MOTION_TIMINGS.enter,
      initial: getToggleOffsetTargetProps(offPosition),
      goals: getToggleOffsetTargetProps(onPosition),
    },
    entered: {
      goals: getToggleOffsetTargetProps(onPosition),
    },
    exiting: {
      tweenInfo: MOTION_TIMINGS.exit,
      goals: getToggleOffsetTargetProps(offPosition),
    },
  };
}
