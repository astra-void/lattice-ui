import { createStrictContext, React } from "@lattice-ui/core";
import { defaultLightTheme } from "./tokens";
import type { Theme, ThemeContextValue, ThemeProviderProps } from "./types";

const [ThemeContextProvider, useThemeContext] = createStrictContext<ThemeContextValue>("ThemeProvider");

export function ThemeProvider(props: ThemeProviderProps) {
  const [internalTheme, setInternalTheme] = React.useState(props.defaultTheme ?? defaultLightTheme);
  const controlled = props.theme !== undefined;
  const resolvedTheme = props.theme ?? internalTheme;

  const setTheme = React.useCallback(
    (nextTheme: Theme) => {
      if (!controlled) {
        setInternalTheme(nextTheme);
      }

      props.onThemeChange?.(nextTheme);
    },
    [controlled, props.onThemeChange],
  );

  const contextValue = React.useMemo(
    () => ({
      theme: resolvedTheme,
      setTheme,
    }),
    [resolvedTheme, setTheme],
  );

  return <ThemeContextProvider value={contextValue}>{props.children}</ThemeContextProvider>;
}

export function useTheme() {
  return useThemeContext();
}

export function useThemeValue<T>(selector: (theme: Theme) => T): T {
  const context = useThemeContext();
  return React.useMemo(() => selector(context.theme), [context.theme, selector]);
}
