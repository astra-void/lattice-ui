---
"@lattice-ui/react-runtime": minor
"@lattice-ui/react-accordion": patch
"@lattice-ui/react-avatar": patch
"@lattice-ui/react-checkbox": patch
"@lattice-ui/react-combobox": patch
"@lattice-ui/react-context-menu": patch
"@lattice-ui/react-dialog": patch
"@lattice-ui/react-menu": patch
"@lattice-ui/react-popover": patch
"@lattice-ui/react-progress": patch
"@lattice-ui/react-radio-group": patch
"@lattice-ui/react-scroll-area": patch
"@lattice-ui/react-select": patch
"@lattice-ui/react-slider": patch
"@lattice-ui/react-switch": patch
"@lattice-ui/react-tabs": patch
"@lattice-ui/react-text-field": patch
"@lattice-ui/react-textarea": patch
"@lattice-ui/react-toast": patch
"@lattice-ui/react-toggle-group": patch
"@lattice-ui/react-tooltip": patch
---

Every part that renders an instance forwards a consumer `ref` to it, so `<Menu.Content ref={contentRef}>`, `<Dialog.Trigger ref={anchorRef}>` and the rest can be measured, used as popper anchors or focused. The parts were plain function components, and `@rbxts/react` strips `ref` from props before a function component sees it, so `passthrough.ref` was always empty and the ref never arrived. They are now `React.forwardRef` components. `getPassthroughProps` (runtime) takes the forwarded ref as an optional third argument and restores it as `passthrough.ref`, which parts compose with the ref they use internally. `Menu.Content`, `ContextMenu.Content` and `Tooltip.Content` used to replace the consumer ref with their own on the default path, and `Tooltip.Content` dropped it under `asChild`; both now compose it.
