---
"@lattice-ui/react-combobox": minor
---

`Combobox` can be driven without a pointer. The root tracks a highlighted item (an active-descendant model: the input keeps focus): Up/Down in the input move it over enabled, matching items with wrap-around (the first press opens a closed list), Enter commits it, and it follows the selected item or the first match as the query changes. Hovering an item moves the same highlight, so `useComboboxItemContext().highlighted` reflects keyboard and pointer alike. `Combobox.Input` registers a focus node, so the navigation controller can reach it inside a `FocusScope`. The package now depends on `@lattice-ui/react-focus`.
