---
"@lattice-ui/react-runtime": minor
"@lattice-ui/react-text-field": patch
"@lattice-ui/react-textarea": patch
---

A controlled `TextField` or `Textarea` keeps showing its value when the consumer rejects or rewrites an edit. Before, rejecting a change in `onValueChange` (a 5-character limit, say) left the extra characters in the TextBox, because no re-render happened to write `Text` back. The input now commits the edit with `flushSync` and restores the committed value when it differs. `@lattice-ui/react-runtime` exports the `flushSync` helper it uses.
