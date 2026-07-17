---
"@lattice-ui/motion": patch
---

The motion scheduler now iterates a snapshot of active hosts and skips hosts removed mid-frame, hardening against re-entrant scheduling during a step.
