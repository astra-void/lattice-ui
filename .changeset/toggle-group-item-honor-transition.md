---
"@lattice-ui/toggle-group": patch
---

`ToggleGroupItem` now honors its declared `transition` prop for the pressed/unpressed response motion instead of always using the built-in selection response recipe. Omitting the prop keeps the previous default behavior.
