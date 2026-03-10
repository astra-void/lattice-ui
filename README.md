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

- `popper` — early positioning foundation
- `select` — currently single-value only
- `slider` — currently single-thumb only
- `preview`
- `preview-engine`
- `preview-runtime`
- `compiler`
- `layout-engine`

Some parts of the UI surface may reach `v1.x` earlier in practice, while preview and tooling packages may remain in `0.x` for longer.
A future `v1` milestone for the main UI layer does **not** automatically mean every experimental or tooling package is fully stabilized.

## Roadmap

### v0.4.x — RC to stable 0.4

- tighten the public package surface
- document package maturity more clearly
- expand tests for overlays, selection, and input behavior
- polish feature-limited packages such as `select` and `slider`
- improve docs and usage examples

### v0.5.x

- continue stabilizing the core UI foundations
- improve overlay positioning and interaction consistency
- close common edge cases across dialog, popover, tooltip, menu, and selection components
- improve CLI workflows and package maintenance ergonomics

### v0.6.x+

- expand preview and tooling workflows
- improve preview reliability, debugging, and coverage
- continue iterating on compiler and layout-engine integration
- keep experimental tooling flexible until the API surface is ready

### v1.0

- ship a stable foundation for the main UI layer
- finalize the supported core package surface
- strengthen compatibility and semver expectations for stable UI packages

### after v1.0

- continue maturing preview/tooling independently
- allow experimental packages to remain in `0.x` if needed
- only promote tooling packages to stable versioning when their APIs and workflows are ready