---
"@lattice-ui/react-checkbox": patch
"@lattice-ui/react-switch": patch
---

`Checkbox.Root` and `Switch.Root` register a focus node, so arrows and the D-pad reach them inside a `FocusScope` such as `Dialog.Content` or a modal `Popover.Content`. Directional navigation only considers registered nodes, so they used to be skipped. Both packages now depend on `@lattice-ui/react-focus`.
