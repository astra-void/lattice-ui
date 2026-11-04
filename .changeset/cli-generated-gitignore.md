---
"lattice-ui": patch
---

The init template no longer ships a `.gitignore` file, which npm strips from the published tarball anyway. `lattice create` and `lattice init` both generate the `.gitignore` themselves, so a dev checkout and the published CLI now behave the same, `init` no longer counts a new `.gitignore` twice in its "created" total, and `create` includes it in its own count.
