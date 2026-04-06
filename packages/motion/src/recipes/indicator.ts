import type { MotionConfig } from "../runtime/types";
import { getIndicatorTargetProps } from "../targets/indicator";
import { MOTION_TIMINGS } from "./timings";

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
