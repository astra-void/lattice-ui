---
"lattice-ui": patch
---

`add`, `remove` and `upgrade` rewrite the package-manager pin in package.json only after you confirm. The repin used to be written before the prompt, so answering "no" printed "Cancelled. Nothing changed." over a package.json that had already been changed. The warning still appears before the prompt.
