import { MOTION_TIMINGS } from "./timings";
import type { MotionConfig } from "../runtime/types";

export function getAccordionRecipe(openHeight: number): MotionConfig {
  return {
    entering: {
      tweenInfo: MOTION_TIMINGS.enter,
      initial: { Size: UDim2.fromOffset(0, 0), ClipsDescendants: true },
      goals: { Size: UDim2.fromOffset(0, openHeight), ClipsDescendants: true },
    },
    entered: {
      goals: { Size: UDim2.fromOffset(0, openHeight), ClipsDescendants: false },
    },
    exiting: {
      tweenInfo: MOTION_TIMINGS.exit,
      goals: { Size: UDim2.fromOffset(0, 0), ClipsDescendants: true },
    },
  };
}
