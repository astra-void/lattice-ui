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

export function snapValueToStep(value: number, min: number, max: number, step: number) {
  const clamped = clampNumber(value, min, max);
  const stepCount = math.round((clamped - min) / step);
  const snapped = min + stepCount * step;
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
