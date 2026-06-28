---
"@lattice-ui/motion": patch
---

Skip appearance properties that don't exist on an instance's class instead of flooding diagnostics with read/write failures. Generic appearance property sets (e.g. `TextColor3`) applied to a class that lacks the member (e.g. `ImageButton`) are now silently no-ops.
