# @lattice-ui/react-select

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
- Open content is an ordered, vertical, wrapping, trapped `FocusScope`: the
  `@lattice-ui/react-focus` navigation controller moves between items with the
  arrow keys / D-pad, and focus cannot leave the list while it is open.
- On open, focus moves to the selected item when it can take focus, else to the
  first enabled item. Closing restores focus to the trigger.
