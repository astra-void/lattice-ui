# @lattice-ui/select

Headless single-select primitives built for Roblox UI.

## Exports

- `Select`
- `Select.Root`
- `Select.Trigger`
- `Select.Value`
- `Select.Portal`
- `Select.Content`
- `Select.Item`
- `Select.Group`
- `Select.Label`
- `Select.Separator`

## Notes

- Single value only in this release.
- Supports controlled/uncontrolled `value` and `open`.
- Content uses dismissable-layer semantics (outside pointer dismiss).
- Trigger and items are gamepad/keyboard selectable and register focus nodes, so
  gamepad users can open the menu, move between items, and commit a selection.
- No built-in directional (arrow-key) keyboard navigation between items.
