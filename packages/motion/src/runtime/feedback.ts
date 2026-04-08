import type { MotionIntent, MotionProperties } from "../core/types";
import { MotionHost } from "./host";
import { resolveFeedbackDriver } from "./spec";

export function applyFeedbackEffect(
  host: MotionHost,
  phase: "accent" | "recover",
  values: MotionProperties | undefined,
  intent?: MotionIntent,
) {
  host.runTimed("feedback", phase, values, resolveFeedbackDriver(phase, intent));
}
