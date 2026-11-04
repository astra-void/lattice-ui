import type { Theme } from "@lattice-ui/react-style";
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
  /** Density-resolved theme for read usage in system-managed trees. */
  theme: Theme;
  /** Raw theme before density transforms. Writes must target this base theme. */
  baseTheme: Theme;
  density: DensityToken;
  /**
   * Use this to update the raw/base theme source. `useTheme().setTheme` from
   * `@lattice-ui/react-style` writes here too inside a system-managed tree, so
   * pass a base theme (for example derived from `baseTheme`), not the
   * density-resolved `theme`, or density is applied twice.
   */
  setBaseTheme: (next: Theme) => void;
  setDensity: (next: DensityToken) => void;
};

export type SystemBaseThemeContextValue = {
  baseTheme: Theme;
  setBaseTheme: (nextTheme: Theme) => void;
};
