---
"@lattice-ui/react-style": patch
"@lattice-ui/react-system": patch
---

Direct props now win over `sx` on `Box` and `Text`, the same as on `Stack`, `Row`, `Grid` and `Surface`. `Box` and `Text` merged `sx` last, so `<Box sx={{ Size: a }} Size={b} />` rendered `a` while the same props on `Stack` rendered `b`. Every style and system component now merges its own defaults, then `sx`, then direct props; `Event` and `Change` handlers from `sx` and direct props are both kept and run in that order. If you relied on `sx` overriding a direct prop on `Box` or `Text`, drop the direct prop or move the value into `sx`.
