import { motionTargets, type FeedbackEffectConfig } from "../core/types";

export function createPressFeedbackEffect(duration = 0.1): FeedbackEffectConfig {
  return {
    target: motionTargets.appearance("press feedback"),
    accent: { duration, tempo: "swift", tone: "expressive" },
    recover: { duration: duration * 1.2, tempo: "swift", tone: "calm" },
  };
}

export function createFocusAccentEffect(duration = 0.15): FeedbackEffectConfig {
  return {
    target: motionTargets.appearance("focus accent"),
    accent: { duration, tempo: "steady", tone: "expressive" },
    recover: { duration: duration * 0.8, tempo: "swift", tone: "calm" },
  };
}
