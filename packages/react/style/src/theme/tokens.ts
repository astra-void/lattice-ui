import type { PartialTheme, Theme } from "./types";

const defaultSpace = {
  0: 0,
  2: 2,
  4: 4,
  6: 6,
  8: 8,
  10: 10,
  12: 12,
  14: 14,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
};

const defaultRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};

const defaultTypography = {
  labelSm: {
    font: Enum.Font.Gotham,
    textSize: 14,
  },
  bodyMd: {
    font: Enum.Font.Gotham,
    textSize: 16,
  },
  titleMd: {
    font: Enum.Font.GothamBold,
    textSize: 22,
  },
};

export const defaultLightTheme: Theme = {
  colors: {
    background: Color3.fromRGB(246, 249, 252),
    surface: Color3.fromRGB(233, 239, 246),
    surfaceElevated: Color3.fromRGB(255, 255, 255),
    border: Color3.fromRGB(193, 202, 214),
    textPrimary: Color3.fromRGB(27, 33, 44),
    textSecondary: Color3.fromRGB(79, 90, 107),
    accent: Color3.fromRGB(46, 114, 216),
    accentContrast: Color3.fromRGB(239, 245, 252),
    danger: Color3.fromRGB(167, 56, 64),
    dangerContrast: Color3.fromRGB(254, 236, 238),
    overlay: Color3.fromRGB(12, 16, 23),
  },
  space: defaultSpace,
  radius: defaultRadius,
  typography: defaultTypography,
};

export const defaultDarkTheme: Theme = {
  colors: {
    background: Color3.fromRGB(18, 21, 26),
    surface: Color3.fromRGB(32, 37, 46),
    surfaceElevated: Color3.fromRGB(40, 47, 60),
    border: Color3.fromRGB(72, 80, 98),
    textPrimary: Color3.fromRGB(233, 239, 246),
    textSecondary: Color3.fromRGB(176, 186, 201),
    accent: Color3.fromRGB(43, 105, 196),
    accentContrast: Color3.fromRGB(240, 244, 250),
    danger: Color3.fromRGB(129, 57, 63),
    dangerContrast: Color3.fromRGB(245, 223, 226),
    overlay: Color3.fromRGB(8, 10, 14),
  },
  space: defaultSpace,
  radius: defaultRadius,
  typography: defaultTypography,
};

function mergeTheme(baseTheme: Theme, partialTheme?: PartialTheme): Theme {
  if (!partialTheme) {
    return {
      colors: { ...baseTheme.colors },
      space: { ...baseTheme.space },
      radius: { ...baseTheme.radius },
      typography: { ...baseTheme.typography },
    };
  }

  return {
    colors: {
      ...baseTheme.colors,
      ...(partialTheme.colors ?? {}),
    },
    space: {
      ...baseTheme.space,
      ...(partialTheme.space ?? {}),
    },
    radius: {
      ...baseTheme.radius,
      ...(partialTheme.radius ?? {}),
    },
    typography: {
      ...baseTheme.typography,
      ...(partialTheme.typography ?? {}),
    },
  };
}

export function createTheme(partialTheme?: PartialTheme) {
  return mergeTheme(defaultLightTheme, partialTheme);
}
