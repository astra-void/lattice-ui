---
"lattice-ui": patch
---

Package-manager detection probes `npm`/`pnpm`/`yarn --version` from the OS temp directory instead of the project. pnpm 10+ reads the project's `devEngines.packageManager` pin, so probing inside the project could install a pinned pnpm and write a `pnpm-lock.yaml` (switching later detection to pnpm), or make pnpm refuse to run under an npm pin so `--pm pnpm` reported it as not installed.
