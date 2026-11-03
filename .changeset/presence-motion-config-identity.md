---
"@lattice-ui/react-motion": patch
---

`usePresenceMotion` no longer restarts a reveal when the component re-renders with a fresh config object. Recipes built inline (`transition={createPopperEntranceRecipe("bottom")}`) change identity every render, and popper content re-renders whenever its anchor moves, so a moving anchor could keep content snapping back to its `initial` values and never finish revealing. Reopening during an exit now reverses from the instance's current values instead of jumping to fully hidden first.
