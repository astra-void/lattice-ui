---
"lattice-ui": patch
---

Package-manager detection finds the shared lockfile of a pnpm, yarn or npm workspace when run inside a workspace member. The CLI used to look for a lockfile only next to the member's own package.json, so it fell back to the `packageManager` pin, the installed managers or a prompt. It now also checks the nearest parent that declares workspaces (`pnpm-workspace.yaml` or a package.json `workspaces` field), and stops at the git root so unrelated lockfiles higher up are ignored.
