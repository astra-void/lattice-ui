# @lattice-ui/react-style

Theme tokens and theme-aware styling helpers for Lattice UI. Unlike the headless primitives, this
package carries appearance.

## Exports

- `ThemeProvider`, `useTheme`, `useThemeValue`
- `createTheme`, `defaultLightTheme`, `defaultDarkTheme`
- `Box`, `Text`
- `createRecipe`
- `resolveSx`, `mergeSx`, `mergeGuiProps`
- `Theme`, `PartialTheme`, `Sx`, `RecipeConfig` and related types

## Notes

- A `Theme` holds `colors`, `space`, `radius` and `typography` tokens. `createTheme(partial)`
  merges a `PartialTheme` over `defaultLightTheme`.
- `ThemeProvider` supports controlled `theme` or uncontrolled `defaultTheme` (default
  `defaultLightTheme`), with `onThemeChange`. `useTheme()` returns `{ theme, setTheme }` and
  errors outside a provider.
- `Sx` is a partial prop table or a `(theme) => props` function. `Box` (a `Frame`) and `Text` (a
  `TextLabel`) accept `sx` plus direct instance props; direct props win, and `Event` / `Change`
  handlers from both run (`sx` first). Both support `asChild` and forward `ref`.
- `Text` adds `truncate` as a shorthand for `TextTruncate.AtEnd`.
- `createRecipe({ base, variants, defaultVariants, compoundVariants })` returns
  `(selection, theme) => props`. Variant groups merge in sorted name order, then matching
  compound variants.
- `mergeGuiProps(base, variant, user)` merges prop layers, later layers winning, with handlers
  composed rather than replaced.
