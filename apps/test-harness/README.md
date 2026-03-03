# @lattice-ui/test-harness

Roblox TestEZ harness workspace for Lattice UI.

## Commands

- `pnpm run test:rbx:prepare`
- `pnpm run test:rbx:place`
- `pnpm run test:rbx:run`

## Studio execution

1. Run `pnpm run test:rbx:run` from the repository root.
2. Open `apps/test-harness/test-harness.rbxlx` in Roblox Studio.
3. Press Play. TestEZ runs from `src/client/main.client.ts` and reports results to Output.

## Notes

- Test modules live under `src/tests/**/*.spec.tsx`.
- Shared test helpers live under `src/test-utils`.
- CI integration is intentionally out of scope for this phase.
