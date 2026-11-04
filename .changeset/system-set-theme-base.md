---
"@lattice-ui/react-system": patch
---

`useTheme().setTheme` works inside a `SystemProvider` tree. `DensityProvider` renders the style `ThemeProvider` controlled by the density-resolved theme but gave it no `onThemeChange`, so the write was dropped and only `useSystemTheme().setBaseTheme` changed the theme. `setTheme` now writes the base theme, the same as `setBaseTheme` (and reaches `SystemProvider`'s `onThemeChange` when the theme is controlled). Density is applied on top, so pass a base theme rather than the density-resolved one.
