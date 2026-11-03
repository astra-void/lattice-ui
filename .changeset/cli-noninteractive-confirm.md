---
"lattice-ui": patch
---

A confirmation prompt with no terminal attached now fails with a usage error (exit code 2) instead of quietly answering "no" and exiting 0. A CI step or script that forgets `--yes` used to pass without installing anything; now it fails and tells you to re-run with `--yes`.
