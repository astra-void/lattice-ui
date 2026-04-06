import type { MotionConfig } from "../runtime/types";
import { getSurfaceTargetProps } from "../targets/surface";
import { MOTION_TIMINGS } from "./timings";

export function getSurfaceRecipe(): MotionConfig {
  return {
    entering: {
      tweenInfo: MOTION_TIMINGS.enter,
      initial: getSurfaceTargetProps(1),
      goals: getSurfaceTargetProps(0),
    },
    entered: {
      goals: getSurfaceTargetProps(0),
    },
    exiting: {
      tweenInfo: MOTION_TIMINGS.exit,
      goals: getSurfaceTargetProps(1),
    },
  };
}
