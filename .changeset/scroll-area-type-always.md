---
"@lattice-ui/react-scroll-area": patch
---

`ScrollArea` with `type="always"` shows its scrollbars even when the content does not overflow, as documented. It used to evaluate exactly like `"auto"` and hide them.
