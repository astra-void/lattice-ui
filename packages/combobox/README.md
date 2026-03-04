# @lattice-ui/combobox

Headless combobox primitives for Roblox UI with typed filtering and enforced option selection.

## Exports

- `Combobox`
- `Combobox.Root`
- `Combobox.Trigger`
- `Combobox.Input`
- `Combobox.Value`
- `Combobox.Portal`
- `Combobox.Content`
- `Combobox.Item`
- `Combobox.Group`
- `Combobox.Label`
- `Combobox.Separator`

## Notes

- Supports controlled/uncontrolled `value`, `inputValue`, and `open`.
- Input text is synchronized back to selected option text when the list closes.
- Filtering defaults to case-insensitive substring matching and can be customized with `filterFn`.
