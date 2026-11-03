---
"@lattice-ui/react-select": patch
---

`Select.Value` keeps showing the selected item's `textValue` while the popup is closed. Items only register while `Select.Content` is mounted, so the label used to fall back to the raw value (`"dark"` instead of `"Dark"`) whenever the popup was closed. The root now caches item labels the same way Combobox does.
