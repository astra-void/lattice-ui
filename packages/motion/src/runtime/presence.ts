import type { MotionIntent, MotionProperties, MotionTargetContract } from "../core/types";
import { MotionHost } from "./host";
import { resolvePresenceDriver } from "./spec";

export function applyPresenceSnapshot(
  host: MotionHost,
  values?: MotionProperties,
  phase = "snapshot",
  target?: MotionTargetContract,
) {
  host.sync(values, "presence", phase, target);
}

export function revealPresence(
  host: MotionHost,
  values: MotionProperties | undefined,
  intent?: MotionIntent,
  onComplete?: () => void,
  target?: MotionTargetContract,
) {
  host.runTimed("presence", "reveal", values, resolvePresenceDriver("reveal", intent), onComplete, target);
}

export function exitPresence(
  host: MotionHost,
  values: MotionProperties | undefined,
  intent?: MotionIntent,
  onComplete?: () => void,
  target?: MotionTargetContract,
) {
  host.runTimed("presence", "exit", values, resolvePresenceDriver("exit", intent), onComplete, target);
}
