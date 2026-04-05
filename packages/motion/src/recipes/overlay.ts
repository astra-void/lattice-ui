import { MOTION_TIMINGS } from "./timings";
import { getOverlayTargetProps } from "../targets/overlay";
import type { MotionConfig } from "../runtime/types";

export function getOverlayRecipe(): MotionConfig {
  return {
    entering: {
      tweenInfo: MOTION_TIMINGS.enter,
      initial: getOverlayTargetProps(1),
      goals: getOverlayTargetProps(0),
    },
    entered: {
      goals: getOverlayTargetProps(0),
    },
    exiting: {
      tweenInfo: MOTION_TIMINGS.exit,
      goals: getOverlayTargetProps(1),
    },
  };
}
