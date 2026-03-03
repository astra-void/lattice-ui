# Changesets Rules

## When to add a changeset

- Add a changeset for any public behavior change in publishable `@lattice-ui/*` packages.
- Skip changesets only for internal-only tasks (for example docs-only changes with zero package impact).

## Lockedstep versioning

- All publishable packages move together in one fixed group.
- Current policy stays on `0.x` until the coordinated `v1.0.0` release milestone.

## Release flow (manual)

1. `pnpm changeset:add`
2. `pnpm release:prepare`
3. Review generated version bumps/changelogs
4. `pnpm release:publish`
