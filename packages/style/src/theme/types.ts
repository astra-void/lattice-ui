import type React from "@rbxts/react";

export type ThemeColors = {
  background: Color3;
  surface: Color3;
  surfaceElevated: Color3;
  border: Color3;
  textPrimary: Color3;
  textSecondary: Color3;
  accent: Color3;
  accentContrast: Color3;
  danger: Color3;
  dangerContrast: Color3;
  overlay: Color3;
};

export type ThemeSpace = {
  0: number;
  2: number;
  4: number;
  6: number;
  8: number;
  10: number;
  12: number;
  14: number;
  16: number;
  20: number;
  24: number;
  32: number;
};

export type ThemeRadius = {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
};

export type ThemeTypographyStyle = {
  font: Enum.Font;
  textSize: number;
};

export type ThemeTypography = {
  labelSm: ThemeTypographyStyle;
  bodyMd: ThemeTypographyStyle;
  titleMd: ThemeTypographyStyle;
};

export type Theme = {
  colors: ThemeColors;
  space: ThemeSpace;
  radius: ThemeRadius;
  typography: ThemeTypography;
};

export type PartialTheme = {
  colors?: Partial<ThemeColors>;
  space?: Partial<ThemeSpace>;
  radius?: Partial<ThemeRadius>;
  typography?: Partial<ThemeTypography>;
};

export type ThemeContextValue = {
  theme: Theme;
  setTheme: (nextTheme: Theme) => void;
};

export type ThemeProviderProps = {
  theme?: Theme;
  defaultTheme?: Theme;
  onThemeChange?: (nextTheme: Theme) => void;
  children?: React.ReactNode;
};
