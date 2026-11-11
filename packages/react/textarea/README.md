# @lattice-ui/react-textarea

Headless multi-line text input primitives for Roblox UI with optional auto-resize behavior.

## Exports

- `Textarea`
- `Textarea.Root`
- `Textarea.Input`
- `Textarea.Label`
- `Textarea.Description`
- `Textarea.Message`
- `useTextareaContext`
- `resolveTextareaHeight`

## Notes

- Supports controlled/uncontrolled `value`.
- `autoResize` is enabled by default and respects `minRows`/`maxRows`.
- `onValueCommit` fires on `FocusLost` commit moments.
- `useTextareaContext()` anywhere under `Textarea.Root` exposes `value`, `invalid`, `required`,
  `disabled`, `readOnly` and `focused` (tracked by the Input), so consumers can style those states.
