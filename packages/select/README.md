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
- Opening content moves selection to the current item or the first enabled fallback.
- Closing content restores selection focus to the trigger.
