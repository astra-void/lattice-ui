---
"@lattice-ui/react-popper": patch
---

Drop the unused `@lattice-ui/react-motion` dependency. `usePopper` now takes React from `@lattice-ui/react-runtime` like the other packages, so installing popper no longer pulls in the motion runtime.
