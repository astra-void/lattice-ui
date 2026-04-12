import type { MotionIntent, MotionProperties, MotionTargetContract } from "../core/types";
import { MotionHost } from "./host";
import { resolveFeedbackDriver } from "./spec";

export function applyFeedbackEffect(
  host: MotionHost,
  phase: "accent" | "recover",
  values: MotionProperties | undefined,
  intent?: MotionIntent,
  target?: MotionTargetContract,
) {
  host.runTimed("feedback", phase, values, resolveFeedbackDriver(phase, intent), undefined, target);
}
