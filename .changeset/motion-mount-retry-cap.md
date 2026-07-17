---
"@lattice-ui/motion": patch
---

presence/response motion hooks now bound the mount-wait retry loop instead of rescheduling every frame indefinitely when a ref never attaches.
