---
"@lattice-ui/react-progress": patch
---

`Progress.Indicator` now fills the indeterminate ratio the context reports (`INDETERMINATE_PROGRESS_RATIO`, 0.25) instead of a separate hardcoded 0.35. `max` is no longer floored to 1, so `max={0.5} value={0.25}` fills half; only a `max` of zero or less falls back to 100. `onValueChange` is deprecated: progress is display-only and never called it, and `defaultValue` is now read once on mount. `useProgressContext` is exported so consumers can style parts from `value`, `max`, `ratio` and `indeterminate`.
