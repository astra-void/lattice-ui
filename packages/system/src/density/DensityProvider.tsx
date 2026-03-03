import { createStrictContext, React, useControllableState } from "@lattice-ui/core";
import { ThemeProvider } from "@lattice-ui/style";
import { useSystemBaseThemeContext } from "../system/baseThemeContext";
import { SystemThemeContextProvider } from "../system/systemThemeContext";
import type { SystemThemeContextValue } from "../system/types";
import { applyDensity } from "./density";
import type { DensityContextValue, DensityProviderProps, DensityToken } from "./types";

const [DensityContextProvider, useDensityContext] = createStrictContext<DensityContextValue>("DensityProvider");
const DEFAULT_DENSITY: DensityToken = "comfortable";

export function DensityProvider(props: DensityProviderProps) {
  const { baseTheme, setBaseTheme } = useSystemBaseThemeContext();

  const [densityValue, setDensityValue] = useControllableState<DensityToken>({
    value: props.density,
    defaultValue: props.defaultDensity ?? DEFAULT_DENSITY,
    onChange: props.onDensityChange,
  });

  // Read-path contract: resolvedTheme is derived from baseTheme + current density.
  const resolvedTheme = React.useMemo(() => applyDensity(baseTheme, densityValue), [baseTheme, densityValue]);

  const setDensity = React.useCallback(
    (nextDensity: DensityToken) => {
      setDensityValue(nextDensity);
    },
    [setDensityValue],
  );

  const densityContextValue = React.useMemo<DensityContextValue>(
    () => ({
      density: densityValue,
      setDensity,
    }),
    [densityValue, setDensity],
  );

  const systemThemeContextValue = React.useMemo<SystemThemeContextValue>(
    () => ({
      theme: resolvedTheme,
      baseTheme,
      density: densityValue,
      setBaseTheme,
      setDensity,
    }),
    [baseTheme, densityValue, resolvedTheme, setBaseTheme, setDensity],
  );

  return (
    <DensityContextProvider value={densityContextValue}>
      <SystemThemeContextProvider value={systemThemeContextValue}>
        <ThemeProvider theme={resolvedTheme}>{props.children}</ThemeProvider>
      </SystemThemeContextProvider>
    </DensityContextProvider>
  );
}

export function useDensity() {
  return useDensityContext();
}
