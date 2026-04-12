import type { MotionIntent, MotionProperties, MotionTargetContract } from "../core/types";
import { MotionHost } from "./host";
import { resolveResponseDriver } from "./spec";

export function settleResponse(
  host: MotionHost,
  values: MotionProperties | undefined,
  intent?: MotionIntent,
  target?: MotionTargetContract,
) {
  host.runFollow("response", values, resolveResponseDriver(intent), target);
}
