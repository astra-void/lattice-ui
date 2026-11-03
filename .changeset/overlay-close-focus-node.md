---
"@lattice-ui/react-dialog": patch
"@lattice-ui/react-popover": patch
---

`Dialog.Close` and `Popover.Close` are reachable with keyboard and gamepad. They now register a focus node and are `Selectable`, so the navigation controller can move to them inside the content's focus scope and Enter/ButtonA closes; an activation guard keeps a paired pointer and keyboard activation from closing twice.
