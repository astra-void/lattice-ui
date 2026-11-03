---
"@lattice-ui/react-avatar": patch
---

`Avatar.Image` works with an `imagebutton` child under `asChild` (a clickable avatar). The load watcher only accepted `ImageLabel`, so the image never reached "loaded" and the fallback showed forever. `delayMs` now also applies when `src` is given only to `Avatar.Image`. The root used to arm the delay from its own `src` alone, so the fallback flashed immediately on every load.
