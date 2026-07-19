import type React from "@rbxts/react";

export type DensityToken = "compact" | "comfortable" | "spacious";

export type DensityProviderProps = {
  density?: DensityToken;
  defaultDensity?: DensityToken;
  onDensityChange?: (next: DensityToken) => void;
  children?: React.ReactNode;
};

export type DensityContextValue = {
  density: DensityToken;
  setDensity: (next: DensityToken) => void;
};
