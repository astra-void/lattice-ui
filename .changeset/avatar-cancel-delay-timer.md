---
"@lattice-ui/avatar": patch
---

Cancel the fallback-delay `task.delay` in a cleanup return so it can no longer set state after AvatarRoot unmounts (or when `src`/`delayMs` change before it fires).
