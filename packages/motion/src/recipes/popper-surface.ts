import { MOTION_TIMINGS } from "./timings";
import type { MotionConfig } from "../runtime/types";
import { getOffsetTargetProps } from "../targets/offset";

export function getPopperSurfaceRecipe(placement: string, offsetDistance: number = 6): MotionConfig {
  return {
    entering: {
      tweenInfo: MOTION_TIMINGS.enter,
      initial: getOffsetTargetProps(placement, offsetDistance),
      goals: getOffsetTargetProps(placement, 0),
    },
    entered: {
      goals: getOffsetTargetProps(placement, 0),
    },
    exiting: {
      tweenInfo: MOTION_TIMINGS.exit,
      goals: getOffsetTargetProps(placement, offsetDistance),
    },
  };
}
