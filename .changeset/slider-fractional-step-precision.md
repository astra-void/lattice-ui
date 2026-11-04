---
"@lattice-ui/react-slider": patch
---

`Slider` values snapped to a fractional `step` are rounded to the decimal precision of `step` and `min`, so stepping by `0.1` from `0.2` yields `0.3` instead of `0.30000000000000004`.
