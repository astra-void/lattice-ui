# @lattice-ui/text-field

Headless text input primitives for Roblox UI with controlled/uncontrolled state and commit events.

## Exports

- `TextField` (`TextFieldRoot` alias)
- `TextFieldRoot`
- `TextFieldInput`
- `TextFieldLabel`
- `TextFieldDescription`
- `TextFieldMessage`

## Notes

- `onValueChange` runs when input text changes.
- `onValueCommit` runs on `FocusLost`/enter-style commit moments.
- `disabled` and `readOnly` are enforced at the root context and reflected by `TextFieldInput`.
