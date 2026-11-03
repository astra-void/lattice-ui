---
"lattice-ui": patch
---

With several package managers installed and no lockfile or pin, `--yes` takes the default (the first in prompt order: npm, then pnpm, then yarn) instead of failing, as "accept the default answer" promises. `lattice create my-game --yes` from the help works again. `doctor` never prompts for a manager either: it picks the default and reports the missing lockfile as its own warning instead of failing. Without `--yes` and without a terminal, the command still fails with a hint to pass `--pm`.
