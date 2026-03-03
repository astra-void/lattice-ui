import { React, useControllableState } from "@lattice-ui/core";
import { defaultLightTheme } from "@lattice-ui/style";
import { DensityProvider } from "../density/DensityProvider";
import { SystemBaseThemeContextProvider } from "./baseThemeContext";
import { useSystemThemeContext } from "./systemThemeContext";
import type { SystemProviderProps, SystemThemeContextValue } from "./types";

export function SystemProvider(props: SystemProviderProps) {
  // SystemProvider owns raw/base theme state. Density is applied in DensityProvider.
  const [baseThemeValue, setBaseThemeValue] = useControllableState({
    value: props.theme,
    defaultValue: props.defaultTheme ?? defaultLightTheme,
    onChange: props.onThemeChange,
  });

  const setBaseTheme = React.useCallback<SystemThemeContextValue["setBaseTheme"]>(
    (nextTheme) => {
      // Write-path contract: updates should target baseTheme, not resolved theme.
      setBaseThemeValue(nextTheme);
    },
    [setBaseThemeValue],
  );

  const baseThemeContextValue = React.useMemo(
    () => ({
      baseTheme: baseThemeValue,
      setBaseTheme,
    }),
    [baseThemeValue, setBaseTheme],
  );

  return (
    <SystemBaseThemeContextProvider value={baseThemeContextValue}>
      <DensityProvider
        defaultDensity={props.defaultDensity}
        density={props.density}
        onDensityChange={props.onDensityChange}
      >
        {props.children}
      </DensityProvider>
    </SystemBaseThemeContextProvider>
  );
}

export function useSystemTheme() {
  return useSystemThemeContext();
}
