import type { Theme } from "@lattice-ui/style";
import type React from "@rbxts/react";
import type { DensityToken } from "../density/types";

export type SystemProviderProps = {
  theme?: Theme;
  defaultTheme?: Theme;
  onThemeChange?: (nextTheme: Theme) => void;
  density?: DensityToken;
  defaultDensity?: DensityToken;
  onDensityChange?: (next: DensityToken) => void;
  children?: React.ReactNode;
};

export type SystemThemeContextValue = {
  theme: Theme;
  baseTheme: Theme;
  density: DensityToken;
  setBaseTheme: (next: Theme) => void;
  setDensity: (next: DensityToken) => void;
};

export type SystemBaseThemeContextValue = {
  baseTheme: Theme;
  setBaseTheme: (nextTheme: Theme) => void;
};
