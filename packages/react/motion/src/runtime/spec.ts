import type { MotionIntent, MotionTone } from "../core/types";

export type MotionCurve = "linear" | "accelerate" | "decelerate" | "standard";
export type TimedStepName = "reveal" | "exit" | "accent" | "recover";

export type TimedDriverConfig = {
  duration: number;
  curve: MotionCurve;
  precision: number;
};

export type FollowDriverConfig = {
  halfLife: number;
  settleAfter: number;
  precision: number;
};

export function applyMotionCurve(curve: MotionCurve, alpha: number) {
  if (curve === "linear") {
    return alpha;
  }

  if (curve === "accelerate") {
    return alpha * alpha;
  }

  if (curve === "decelerate") {
    return 1 - (1 - alpha) * (1 - alpha);
  }

  if (alpha < 0.5) {
    return 2 * alpha * alpha;
  }

  return 1 - math.pow(-2 * alpha + 2, 2) / 2;
}

function resolveTempoDuration(
  intent: MotionIntent | undefined,
  defaults: {
    instant: number;
    swift: number;
    steady: number;
    gentle: number;
  },
) {
  if (intent?.duration !== undefined) {
    return math.max(0, intent.duration);
  }

  const tempo = intent?.tempo ?? "steady";

  if (tempo === "instant") return defaults.instant;
  if (tempo === "swift") return defaults.swift;
  if (tempo === "gentle") return defaults.gentle;
  return defaults.steady;
}

function resolveTone(intent: MotionIntent | undefined, fallback: MotionTone) {
  return intent?.tone ?? fallback;
}

export function resolvePresenceDriver(step: "reveal" | "exit", intent?: MotionIntent): TimedDriverConfig {
  const tone = resolveTone(intent, step === "exit" ? "calm" : "responsive");
  const duration = resolveTempoDuration(intent, {
    instant: 0,
    swift: step === "exit" ? 0.08 : 0.1,
    steady: step === "exit" ? 0.11 : 0.14,
    gentle: step === "exit" ? 0.14 : 0.2,
  });

  if (duration <= 0) {
    return { duration: 0, curve: "linear", precision: 0.0005 };
  }

  return {
    duration,
    curve: step === "exit" ? "accelerate" : tone === "expressive" ? "standard" : "decelerate",
    precision: 0.0005,
  };
}

export function resolveResponseDriver(intent?: MotionIntent): FollowDriverConfig {
  const tone = resolveTone(intent, "responsive");
  const duration = resolveTempoDuration(intent, {
    instant: 0,
    swift: 0.1,
    steady: 0.14,
    gentle: 0.2,
  });

  if (duration <= 0) {
    return { halfLife: 0, settleAfter: 0, precision: 0.0005 };
  }

  return {
    halfLife: duration * (tone === "responsive" ? 0.35 : tone === "expressive" ? 0.28 : 0.45),
    settleAfter: duration * 2.5,
    precision: 0.0005,
  };
}

export function resolveFeedbackDriver(step: "accent" | "recover", intent?: MotionIntent): TimedDriverConfig {
  const tone = resolveTone(intent, step === "accent" ? "expressive" : "calm");
  const duration = resolveTempoDuration(intent, {
    instant: 0,
    swift: step === "accent" ? 0.08 : 0.1,
    steady: step === "accent" ? 0.1 : 0.14,
    gentle: step === "accent" ? 0.14 : 0.18,
  });

  if (duration <= 0) {
    return { duration: 0, curve: "linear", precision: 0.0005 };
  }

  return {
    duration,
    curve: step === "accent" ? (tone === "expressive" ? "standard" : "decelerate") : "accelerate",
    precision: 0.0005,
  };
}
