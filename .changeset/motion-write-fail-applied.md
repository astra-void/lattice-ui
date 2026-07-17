---
"@lattice-ui/motion": patch
---

MotionHost no longer records a value as applied when the underlying property write fails, keeping applied state consistent with what was committed to the instance.
