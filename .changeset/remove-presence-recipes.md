---
"@lattice-ui/react-motion": minor
---

Remove the presence recipes: `createSurfaceRevealRecipe`, `createCanvasGroupRevealRecipe`, `createToastRevealRecipe`, `createOverlayFadeRecipe`, `createPopperEntranceRecipe`, `createCanvasGroupPopperEntranceRecipe` and `createIndicatorRevealRecipe`. Each ended a reveal at a fixed appearance (`BackgroundTransparency: 0`, or `0.5` for the overlay fade), so applying one to a host the consumer kept transparent turned it opaque grey. Primitives already default to no motion, so nothing changes unless a recipe was passed as a `transition`; write that `PresenceMotionConfig` in your app instead. `motionDuration`, `motionExitDuration`, `motionOffset` and `createPlacementOffset` stay exported for building it.
