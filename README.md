## Stability and Versioning

Lattice UI is currently in the `0.x` phase.

The workspace uses lockedstep versioning today, but not every package is at the same maturity level.
In practice, this means the version number alone should not be read as a guarantee that every package is equally stable.

### Stable direction

These packages represent the long-term stable direction of Lattice UI and are the main path toward `v1.0`:

- foundations: `core`, `focus`, `layer`, `style`, `system`
- primary UI packages: `accordion`, `avatar`, `checkbox`, `combobox`, `dialog`, `menu`, `popover`, `progress`, `radio-group`, `scroll-area`, `switch`, `tabs`, `text-field`, `textarea`, `toast`, `toggle-group`, `tooltip`

### Experimental or feature-limited

These packages are available, but should still be treated as experimental, evolving, or intentionally limited in scope:

- `popper` - early positioning foundation
- `select` - currently single-value only
- `slider` - currently single-thumb only

Some parts of the UI surface may reach `v1.x` earlier in practice, while feature-limited packages may remain in `0.x` for longer.
A future `v1` milestone for the main UI layer does **not** automatically mean every experimental or tooling package is fully stabilized.

## Release workflow

- Package publishing is handled by `.github/workflows/publish.yml` from release tags such as `v0.5.0` or `v0.5.0-next.1`.
- Stable tags publish with npm's default `latest` dist-tag. Prerelease tags automatically publish to the first prerelease identifier, for example `v0.5.0-next.1 -> --tag next`.
- The workflow validates that every publishable workspace package version exactly matches the release tag version before publishing. It does not run `changeset version`, create release PRs, or generate tags.
- `workflow_dispatch` remains available for manual dry-runs or manual publishes when you provide the exact release tag to validate.
- npm trusted publisher settings must target the exact `publish.yml` workflow filename, and the same trusted publisher configuration must be applied to each published package.

## Roadmap

### v0.6.x+

- expand package maintenance workflows
- improve reliability, debugging, and coverage
- keep feature-limited packages flexible until the API surface is ready

### v1.0

- ship a stable foundation for the main UI layer
- finalize the supported core package surface
- strengthen compatibility and semver expectations for stable UI packages

### after v1.0

- continue maturing feature-limited packages independently
- allow experimental packages to remain in `0.x` if needed
- only promote feature-limited packages to stable versioning when their APIs are ready
