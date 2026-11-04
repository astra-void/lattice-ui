---
"lattice-ui": patch
---

The global `--verbose` and `--yes` / `-y` options are accepted before the command name, so `lattice --verbose add dialog` no longer fails with "Unknown global option". Every command's `--help` now lists `--verbose`, and the root help lists `--yes`.
