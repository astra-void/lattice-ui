---
"@lattice-ui/react-tooltip": patch
---

`Tooltip.Trigger` opens from managed focus. It registers a focus node and drives focus-open from its `onFocusChange`, instead of listening to the engine's `SelectionGained`/`SelectionLost`. Inside a `FocusScope` the navigation controller can now reach the trigger and the tooltip opens when it does; before, the trigger was unreachable and `SelectedObject` was never mirrored onto it. The package now depends on `@lattice-ui/react-focus`.
