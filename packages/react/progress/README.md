# @lattice-ui/react-progress

Headless progress and spinner primitives for Roblox UI.

## Exports

- `Progress`
- `Progress.Root`
- `Progress.Indicator`
- `Progress.Spinner`
- `useProgressContext` — `{ value, max, ratio, indeterminate }` for styling parts by state
- `clampProgressValue`, `resolveProgressRatio`, `INDETERMINATE_PROGRESS_RATIO`

## Notes

- `Progress` is display-only: `value` drives it, and `defaultValue` is used only when `value` is not given (read once, on mount). `onValueChange` is deprecated and never called.
- `value` is clamped to `[0, max]`. `max` defaults to 100 and may be fractional; a `max` of zero or less falls back to 100.
- `indeterminate` mode fills `INDETERMINATE_PROGRESS_RATIO` (0.25), the same `ratio` the context reports.
- `Spinner` defaults to `spinning=true` and turns `speedDegPerSecond` degrees per second (default `180`; negative turns the other way) through `useLoopMotion` from `@lattice-ui/react-motion`. It follows the motion policy: under `MotionProvider disableAllMotion` or the platform reduced-motion setting it does not spin and rests at `Rotation` 0.
