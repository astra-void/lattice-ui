import type { MotionIntent, MotionProperties } from "../core/types";
import { MotionHost } from "./host";
import { resolvePresenceDriver } from "./spec";

export function applyPresenceSnapshot(host: MotionHost, values?: MotionProperties) {
  host.sync(values);
}

export function revealPresence(host: MotionHost, values: MotionProperties | undefined, intent?: MotionIntent) {
  host.runTimed("presence", "reveal", values, resolvePresenceDriver("reveal", intent));
}

export function exitPresence(
  host: MotionHost,
  values: MotionProperties | undefined,
  intent?: MotionIntent,
  onComplete?: () => void,
) {
  host.runTimed("presence", "exit", values, resolvePresenceDriver("exit", intent), onComplete);
}
