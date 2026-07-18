---
"@lattice-ui/switch": minor
---

Remove the vestigial `forceMount` prop declaration from `SwitchThumbProps`. The deprecated SwitchThumb forceMount behavior was already removed in 0.4.0; the prop has been a silent no-op since then and the thumb is always mounted.
