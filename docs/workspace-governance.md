# Workspace Governance

## Goals

- Keep package structure modular without increasing maintenance cost.
- Enforce lockedstep versioning for publishable packages.
- Prevent dependency and metadata drift with deterministic scripts.

## Create a New Package

1. Run `pnpm package:new --name <kebab-name>`.
2. Optionally include deps and app linking:
   `pnpm package:new --name slider --deps core,focus --app-link playground`
3. Implement code in `packages/<name>/src`.
4. Verify policy with `pnpm workspace:check`.

## Dependency Rules

- Internal workspace dependencies must always use `workspace:*`.
- Publishable packages must include peer deps:
  - `@rbxts/react: ^17`
  - `@rbxts/react-roblox: ^17`
- Canonical metadata and typecheck paths are auto-fixed by `pnpm workspace:sync`.

## Changeset Rules

- Public package changes require a changeset (`pnpm changeset:add`).
- `apps/*` workspaces are ignored from publish versioning.
- Publishable `packages/*` are locked in one fixed version group.

## Manual Release Steps

1. Ensure there is at least one pending changeset.
2. Run `pnpm release:prepare`.
3. Review changed package versions and changelog entries.
4. Publish with `pnpm release:publish`.
5. Inspect `pnpm-publish-summary.json` if needed.

## v1.0.0 Upgrade Plan

- Stay on lockedstep `0.x` until the v1 milestone is ready.
- Add one coordinated major changeset.
- Run `pnpm release:prepare` and publish all packages together.
