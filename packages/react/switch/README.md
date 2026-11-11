# @lattice-ui/react-switch

Headless on/off switch primitives for Roblox UI.

## Exports

- `Switch`
- `Switch.Root`
- `Switch.Thumb`

## Notes

- Supports controlled/uncontrolled `checked` (`checked` / `defaultChecked` / `onCheckedChange`).
- `Root` renders a `TextButton` and toggles on `Activated`. `disabled` blocks toggling and makes
  the root non-selectable.
- `Root` registers a focus node, so the `@lattice-ui/react-focus` navigation controller can reach
  it inside a `FocusScope`.
- `Thumb` travel is behavior: it animates `AnchorPoint` and `Position` between the track's leading
  and trailing edge (vertically centred) through `useResponseMotion`, for any thumb or track size.
  `AnchorPoint` and `Position` passed to `Thumb` are dropped because motion owns them.
- Under `asChild`, `Thumb` keeps its own wrapper frame (sized to the child's `Size`) as the
  animated host and pins the consumer's element inside it.
- Parts set no colors, sizes, fonts or text; they only neutralize Roblox instance defaults.
  Consumer instance props and `Event` handlers pass through, and a consumer `ref` reaches the
  rendered instance.
