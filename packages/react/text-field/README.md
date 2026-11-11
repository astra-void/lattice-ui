# @lattice-ui/react-text-field

Headless text input primitives for Roblox UI with controlled/uncontrolled state and commit events.

## Exports

- `TextField`
- `TextField.Root`
- `TextField.Input`
- `TextField.Label`
- `TextField.Description`
- `TextField.Message`
- `useTextFieldContext`

## Notes

- `onValueChange` runs when input text changes.
- `onValueCommit` runs on `FocusLost`/enter-style commit moments.
- `disabled` and `readOnly` are enforced at the root context and reflected by `TextFieldInput`.
- `useTextFieldContext()` anywhere under `TextField.Root` exposes `value`, `invalid`, `required`,
  `disabled`, `readOnly` and `focused` (tracked by the Input), so consumers can style those states.
