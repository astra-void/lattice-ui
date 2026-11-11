# @lattice-ui/react-system

Theme, density and layout building blocks on top of `@lattice-ui/react-style`. Like
`react-style`, this package carries appearance.

## Exports

- `SystemProvider`, `useSystemTheme`
- `DensityProvider`, `useDensity`, `applyDensity`, `density`
- `Stack`, `Row`, `Grid`
- `Surface`, `surface`
- `SystemProviderProps`, `StackProps`, `GridProps`, `SurfaceProps` and related types

## Notes

- `SystemProvider` owns the base theme (controlled `theme` or `defaultTheme`) and density
  (`density` / `defaultDensity`, `"comfortable"` by default), and provides the density-scaled
  theme through `ThemeProvider`, so `useTheme()` reads it.
- `useSystemTheme()` returns `{ theme, baseTheme, density, setBaseTheme, setDensity }`. Write the
  base theme, not the density-resolved one, or density is applied twice.
- Density (`compact`, `comfortable`, `spacious`) scales `space`, `radius` and text sizes only;
  `applyDensity` and `density(token)` are pure theme transforms.
- `Stack` renders a transparent `Frame` with a `UIListLayout` (`direction`, `gap`, `align`,
  `justify`) and an optional `UIPadding`. `Row` is a horizontal `Stack`. `Grid` uses a
  `UIGridLayout` with fixed `columns` or as many as fit `minColumnWidth`, recomputed on resize.
- Spacing props take a theme `space` token or a number of pixels; `autoSize` sets `AutomaticSize`.
- `Surface` renders a `Frame` filled from a `tone` (`surface`, `elevated`, `sunken`, `overlay`)
  and, except for `overlay`, adds a `UICorner` and `UIStroke`. `surface(tone)` returns the same
  host props as an `Sx` without creating children.
- Layout and surface components accept `sx` and direct props (direct props win) and forward `ref`;
  they do not support `asChild`.
