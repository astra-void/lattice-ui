import type { SliderOrientation } from "../types";

export function clampNumber(value: number, min: number, max: number) {
  return math.clamp(value, min, max);
}

export function normalizeBounds(min: number, max: number) {
  if (min <= max) {
    return {
      min,
      max,
    };
  }

  return {
    min: max,
    max: min,
  };
}

export function normalizeStep(step: number) {
  return step > 0 ? step : 1;
}

const MAX_DECIMALS = 10;

// Number of decimal places needed to represent `value`, capped at MAX_DECIMALS.
// Pure math so it compiles to Luau the same way it runs in tests.
function countDecimals(value: number) {
  let scaled = math.abs(value);
  let decimals = 0;
  while (decimals < MAX_DECIMALS && math.abs(scaled - math.round(scaled)) > 1e-9) {
    scaled *= 10;
    decimals += 1;
  }

  return decimals;
}

function roundToDecimals(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return math.round(value * factor) / factor;
}

export function snapValueToStep(value: number, min: number, max: number, step: number) {
  const clamped = clampNumber(value, min, max);
  const stepCount = math.round((clamped - min) / step);
  // `min + stepCount * step` carries binary floating-point error (0.2 + 0.1 = 0.30000000000000004),
  // so round to the precision of `step` and `min`.
  const precision = math.max(countDecimals(step), countDecimals(min));
  const snapped = roundToDecimals(min + stepCount * step, precision);
  return clampNumber(snapped, min, max);
}

export function valueToPercent(value: number, min: number, max: number) {
  if (max <= min) {
    return 0;
  }

  return clampNumber((value - min) / (max - min), 0, 1);
}

export function percentToValue(percent: number, min: number, max: number, step: number) {
  const clampedPercent = clampNumber(percent, 0, 1);
  const rawValue = min + (max - min) * clampedPercent;
  return snapValueToStep(rawValue, min, max, step);
}

export function pointerPositionToPercent(
  pointerPosition: Vector2,
  trackPosition: Vector2,
  trackSize: Vector2,
  orientation: SliderOrientation,
) {
  if (orientation === "horizontal") {
    if (trackSize.X <= 0) {
      return 0;
    }

    const percent = (pointerPosition.X - trackPosition.X) / trackSize.X;
    return clampNumber(percent, 0, 1);
  }

  if (trackSize.Y <= 0) {
    return 0;
  }

  const percent = 1 - (pointerPosition.Y - trackPosition.Y) / trackSize.Y;
  return clampNumber(percent, 0, 1);
}

export function pointerPositionToValue(
  pointerPosition: Vector2,
  trackPosition: Vector2,
  trackSize: Vector2,
  min: number,
  max: number,
  step: number,
  orientation: SliderOrientation,
) {
  const percent = pointerPositionToPercent(pointerPosition, trackPosition, trackSize, orientation);
  return percentToValue(percent, min, max, step);
}
