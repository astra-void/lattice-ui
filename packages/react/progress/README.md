# @lattice-ui/react-progress

Headless progress and spinner primitives for Roblox UI.

## Exports

- `Progress`
- `Progress.Root`
- `Progress.Indicator`
- `Progress.Spinner`

## Notes

- `Progress` supports `value`/`max` and clamps out-of-range values.
- `indeterminate` mode uses a fixed indicator ratio.
- `Spinner` defaults to `spinning=true` and turns `speedDegPerSecond` degrees per second (default `180`; negative turns the other way) through `useLoopMotion` from `@lattice-ui/react-motion`. It follows the motion policy: under `MotionProvider disableAllMotion` or the platform reduced-motion setting it does not spin and rests at `Rotation` 0.
