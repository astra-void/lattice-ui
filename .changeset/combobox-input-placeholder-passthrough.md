---
"@lattice-ui/react-combobox": patch
---

`Combobox.Input` sets `PlaceholderText` only when `placeholder` is given. Before, it always set `PlaceholderText` (to `""` without `placeholder`) after the consumer's props, so `<Combobox.Input PlaceholderText="Search" />` or an `asChild` TextBox with its own `PlaceholderText` showed no placeholder.
