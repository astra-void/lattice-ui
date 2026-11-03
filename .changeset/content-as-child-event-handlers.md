---
"@lattice-ui/react-runtime": minor
"@lattice-ui/react-dialog": patch
"@lattice-ui/react-popover": patch
"@lattice-ui/react-menu": patch
"@lattice-ui/react-context-menu": patch
"@lattice-ui/react-tooltip": patch
---

`Event` and `Change` handlers passed to a `Content` part with `asChild` now connect. `@rbxts/react` converts those tables into React-keyed props only inside `createElement`, and the `asChild` paths of `Dialog`, `Popover`, `Menu`, `ContextMenu` and `Tooltip` content clone the consumer's element with `cloneElement`, so the raw tables reached the instance unconverted and replaced the child's own handlers. The new `toCloneElementProps` helper in `@lattice-ui/react-runtime` performs the conversion and composes with the child's handlers, child first, the same rule `Slot` applies.
