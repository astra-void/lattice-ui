import type { Theme } from "@lattice-ui/style";

export type DensityToken = "compact" | "comfortable" | "spacious";

type DensityScale = {
  space: number;
  radius: number;
  typography: number;
};

const DENSITY_SCALES: Record<DensityToken, DensityScale> = {
  compact: {
    space: 0.85,
    radius: 0.9,
    typography: 0.92,
  },
  comfortable: {
    space: 1,
    radius: 1,
    typography: 1,
  },
  spacious: {
    space: 1.15,
    radius: 1.1,
    typography: 1.08,
  },
};

function scaleNonNegative(value: number, factor: number) {
  return math.max(0, math.round(value * factor));
}

function scaleTextSize(value: number, factor: number) {
  return math.max(10, math.round(value * factor));
}

function scaleSpace(theme: Theme, factor: number): Theme["space"] {
  return {
    0: scaleNonNegative(theme.space[0], factor),
    2: scaleNonNegative(theme.space[2], factor),
    4: scaleNonNegative(theme.space[4], factor),
    6: scaleNonNegative(theme.space[6], factor),
    8: scaleNonNegative(theme.space[8], factor),
    10: scaleNonNegative(theme.space[10], factor),
    12: scaleNonNegative(theme.space[12], factor),
    14: scaleNonNegative(theme.space[14], factor),
    16: scaleNonNegative(theme.space[16], factor),
    20: scaleNonNegative(theme.space[20], factor),
    24: scaleNonNegative(theme.space[24], factor),
    32: scaleNonNegative(theme.space[32], factor),
  };
}

function scaleRadius(theme: Theme, factor: number): Theme["radius"] {
  return {
    none: scaleNonNegative(theme.radius.none, factor),
    sm: scaleNonNegative(theme.radius.sm, factor),
    md: scaleNonNegative(theme.radius.md, factor),
    lg: scaleNonNegative(theme.radius.lg, factor),
    xl: scaleNonNegative(theme.radius.xl, factor),
    full: scaleNonNegative(theme.radius.full, factor),
  };
}

function scaleTypography(theme: Theme, factor: number): Theme["typography"] {
  return {
    labelSm: {
      font: theme.typography.labelSm.font,
      textSize: scaleTextSize(theme.typography.labelSm.textSize, factor),
    },
    bodyMd: {
      font: theme.typography.bodyMd.font,
      textSize: scaleTextSize(theme.typography.bodyMd.textSize, factor),
    },
    titleMd: {
      font: theme.typography.titleMd.font,
      textSize: scaleTextSize(theme.typography.titleMd.textSize, factor),
    },
  };
}

/**
 * M1 limitation: density is a pure theme transformer.
 * It does not create layout or child instances.
 */
export function applyDensity(theme: Theme, token: DensityToken): Theme {
  const scale = DENSITY_SCALES[token];

  return {
    colors: { ...theme.colors },
    space: scaleSpace(theme, scale.space),
    radius: scaleRadius(theme, scale.radius),
    typography: scaleTypography(theme, scale.typography),
  };
}

/**
 * M1 limitation: this helper only returns a theme transformer.
 * It does not modify instance graphs or perform runtime layout composition.
 */
export function density(token: DensityToken) {
  return (theme: Theme) => applyDensity(theme, token);
}
