---
"@lattice-ui/react-context-menu": minor
---

`ContextMenu` works with keyboard, gamepad and touch. `ContextMenu.Content` is an ordered, vertical focus scope like `Menu.Content` (trapped while `modal`, restoring focus on close), the first item is focused once per open, and items register focus nodes so arrows/D-pad move between them and Enter/ButtonA selects. Items are `Selectable` unless disabled and `highlighted` follows managed focus as well as hover. `ContextMenu.Trigger` also opens on a touch long-press at the touch position. The package now depends on `@lattice-ui/react-focus`.
