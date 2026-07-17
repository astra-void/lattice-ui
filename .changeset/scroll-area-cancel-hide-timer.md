---
"@lattice-ui/scroll-area": patch
---

Cancel the pending scrollbar auto-hide `task.delay` when a new scroll arrives and on unmount, so the timer can no longer fire a state update after the ScrollArea has been torn down.
