# @lattice-ui/test-harness

Roblox TestEZ harness workspace for Lattice UI.

## Commands

- `pnpm run test:rbx:prepare`
- `pnpm run test:rbx`
- `pnpm run test:rbx:place`
- `pnpm run test:rbx:headless`
- `pnpm run test:rbx:run`

## Core validation (no external launch)

1. Run `pnpm run test:rbx` from the repository root.
2. This runs `test:rbx:prepare` (typecheck + harness build) without launching external programs.

## Optional external execution

### Headless runner

1. Run `pnpm run test:rbx:headless` from the repository root.
2. The command builds a place, starts Roblox headlessly, and exits non-zero on failure/timeout.
3. If emitted by the runner, logs are written to `run-in-roblox.log` at the repository root.
4. `run-in-roblox` writes a temporary plugin under `~/Documents/Roblox/Plugins`; if the environment blocks writes there, the command can fail with `Operation not permitted (os error 1)`.

### Studio manual fallback

1. Run `pnpm run test:rbx:run` from the repository root.
2. Open `apps/test-harness/test-harness.rbxlx` in Roblox Studio.
3. Press Play. TestEZ runs from `src/client/main.client.ts` and reports results to Output.

## Notes

- Test modules live under `src/tests/**/*.spec.tsx`.
- Shared test helpers live under `src/test-utils`.
- CI integration is intentionally out of scope for this phase.
