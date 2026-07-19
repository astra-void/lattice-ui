---
"@lattice-ui/style": minor
---

Add an opt-in `truncate` prop to `Text`. When `true`, text that does not fit
the label's width is clipped with a trailing ellipsis (`TextTruncate.AtEnd`).
Defaults are unchanged, and an explicit `TextTruncate` prop still overrides the
shorthand.
