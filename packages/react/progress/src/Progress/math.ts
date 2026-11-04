/** Fill ratio used while progress is indeterminate; both the context `ratio` and the fill use it. */
export const INDETERMINATE_PROGRESS_RATIO = 0.25;

const DEFAULT_PROGRESS_MAX = 100;

/** `max` must be positive; anything else falls back to the default of 100. Fractional maxima are kept. */
export function resolveProgressMax(max: number | undefined) {
  return max !== undefined && max > 0 ? max : DEFAULT_PROGRESS_MAX;
}

export function clampProgressValue(value: number, max: number) {
  return math.clamp(value, 0, resolveProgressMax(max));
}

export function resolveProgressRatio(value: number, max: number, indeterminate?: boolean) {
  if (indeterminate === true) {
    return INDETERMINATE_PROGRESS_RATIO;
  }

  const safeMax = resolveProgressMax(max);
  const clamped = clampProgressValue(value, safeMax);
  return clamped / safeMax;
}
