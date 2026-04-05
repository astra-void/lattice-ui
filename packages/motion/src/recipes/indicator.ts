import { MOTION_TIMINGS } from "./timings";
import { getIndicatorTargetProps } from "../targets/indicator";
import type { MotionConfig } from "../runtime/types";

export function getIndicatorRecipe(): MotionConfig {
  return {
    entering: {
      tweenInfo: MOTION_TIMINGS.enter,
      initial: getIndicatorTargetProps(1),
      goals: getIndicatorTargetProps(0),
    },
    entered: {
      goals: getIndicatorTargetProps(0),
    },
    exiting: {
      tweenInfo: MOTION_TIMINGS.exit,
      goals: getIndicatorTargetProps(1),
    },
  };
}
