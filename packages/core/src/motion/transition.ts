import type { MotionKeyframe, MotionProperties, MotionTransition } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeIs(value, "table");
}

function cloneMotionProperties(properties?: MotionProperties) {
  if (!properties) {
    return undefined;
  }

  return { ...properties };
}

function mergeMotionProperties(base?: MotionProperties, override?: MotionProperties) {
  if (!base && !override) {
    return undefined;
  }

  if (!base) {
    return cloneMotionProperties(override);
  }

  if (!override) {
    return cloneMotionProperties(base);
  }

  return {
    ...base,
    ...override,
  };
}

export function mergeMotionKeyframe(base?: MotionKeyframe, override?: MotionKeyframe) {
  if (!base && !override) {
    return undefined;
  }

  if (!base) {
    return override
      ? {
          tweenInfo: override.tweenInfo,
          from: cloneMotionProperties(override.from),
          to: cloneMotionProperties(override.to),
        }
      : undefined;
  }

  if (!override) {
    return {
      tweenInfo: base.tweenInfo,
      from: cloneMotionProperties(base.from),
      to: cloneMotionProperties(base.to),
    };
  }

  return {
    tweenInfo: override.tweenInfo ?? base.tweenInfo,
    from: mergeMotionProperties(base.from, override.from),
    to: mergeMotionProperties(base.to, override.to),
  };
}

export function mergeMotionTransition(base?: MotionTransition, override?: MotionTransition | false) {
  if (override === false) {
    return false;
  }

  if (!base && !override) {
    return undefined;
  }

  if (!base) {
    return override
      ? {
          enter: mergeMotionKeyframe(undefined, override.enter),
          exit: mergeMotionKeyframe(undefined, override.exit),
        }
      : undefined;
  }

  if (!override) {
    return {
      enter: mergeMotionKeyframe(base.enter),
      exit: mergeMotionKeyframe(base.exit),
    };
  }

  return {
    enter: mergeMotionKeyframe(base.enter, override.enter),
    exit: mergeMotionKeyframe(base.exit, override.exit),
  };
}

function getTweenDurationMs(tweenInfo?: TweenInfo) {
  if (!tweenInfo) {
    return 0;
  }

  const time = tweenInfo.Time;
  const delay = tweenInfo.DelayTime;
  const repeatCount = tweenInfo.RepeatCount;
  const reverses = tweenInfo.Reverses;

  let multiplier;
  if (repeatCount >= 0) {
    multiplier = repeatCount + 1;
  } else {
    // If infinite (-1), fallback should not be infinite. Just use 1 repeat as a baseline,
    // or cap the total time. Let's say 1 repeat for fallback.
    multiplier = 1;
  }

  if (reverses) {
    multiplier *= 2;
  }

  const totalTime = delay + time * multiplier;

  return math.max(0, math.floor(totalTime * 1000));
}

export function getMotionTransitionExitFallbackMs(transition?: MotionTransition | false) {
  if (!transition) {
    return 0;
  }

  return getTweenDurationMs(transition.exit?.tweenInfo);
}

export function applyMotionProperties(instance: Instance, properties?: MotionProperties) {
  if (!properties) {
    return;
  }

  for (const [rawKey, rawValue] of pairs(properties)) {
    if (!typeIs(rawKey, "string")) {
      continue;
    }

    (instance as unknown as Record<string, unknown>)[rawKey] = rawValue;
  }
}

export function isMotionTransition(value: unknown): value is MotionTransition {
  if (!isRecord(value)) {
    return false;
  }

  return "enter" in value || "exit" in value;
}
