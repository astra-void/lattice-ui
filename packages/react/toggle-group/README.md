# @lattice-ui/react-toggle-group

Behavior-only ToggleGroup primitives for Roblox UI, aligned with the lattice compound pattern.

## Exports

- `ToggleGroup`
- `ToggleGroup.Root`
- `ToggleGroup.Item`

## Notes

- `type` is `"single"` (at most one item pressed) or `"multiple"`.
- Items toggle on activation (click, Enter/Space, ButtonA). Gamepad selection fires both
  `Activated` and `InputBegan`; one activation still toggles once.
- `orientation` (`"horizontal"` by default, or `"vertical"`) picks the arrow keys that move focus
  between enabled items, in layout order (`LayoutOrder`). Unlike RadioGroup, moving focus does not
  change which items are pressed.
