import { React, useControllableState } from "@lattice-ui/core";
import { defaultLightTheme } from "@lattice-ui/style";
import { DensityProvider } from "../density/DensityProvider";
import type { SystemProviderProps, SystemThemeContextValue } from "./types";
import { SystemBaseThemeContextProvider } from "./baseThemeContext";
import { useSystemThemeContext } from "./systemThemeContext";

export function SystemProvider(props: SystemProviderProps) {
  const [baseThemeValue, setBaseThemeValue] = useControllableState({
    value: props.theme,
    defaultValue: props.defaultTheme ?? defaultLightTheme,
    onChange: props.onThemeChange,
  });

  const setBaseTheme = React.useCallback<SystemThemeContextValue["setBaseTheme"]>(
    (nextTheme) => {
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
