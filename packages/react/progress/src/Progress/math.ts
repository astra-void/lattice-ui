export function clampProgressValue(value: number, max: number) {
  const safeMax = math.max(1, max);
  return math.clamp(value, 0, safeMax);
}

export function resolveProgressRatio(value: number, max: number, indeterminate?: boolean) {
  if (indeterminate === true) {
    return 0.25;
  }

  const safeMax = math.max(1, max);
  const clamped = clampProgressValue(value, safeMax);
  return clamped / safeMax;
}
