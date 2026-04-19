## Stability and Versioning

Lattice UI is currently in the `0.x` phase.

The workspace uses lockedstep versioning today, but not every package is at the same maturity level.
In practice, this means the version number alone should not be read as a guarantee that every package is equally stable.

### Stable direction

These packages represent the long-term stable direction of Lattice UI and are the main path toward `v1.0`:

- foundations: `core`, `focus`, `layer`, `motion`, `style`, `system`
- primary UI packages: `accordion`, `avatar`, `checkbox`, `combobox`, `dialog`, `menu`, `popover`, `progress`, `radio-group`, `scroll-area`, `switch`, `tabs`, `text-field`, `textarea`, `toast`, `toggle-group`, `tooltip`

### Experimental or feature-limited

These packages are available, but should still be treated as experimental, evolving, or intentionally limited in scope:

- `popper` - experimental positioning foundation with placement-relative offsets and viewport collision handling
- `select` - currently single-value only
- `slider` - currently single-thumb only

Some parts of the UI surface may reach `v1.x` earlier in practice, while feature-limited packages may remain in `0.x` for longer.
A future `v1` milestone for the main UI layer does **not** automatically mean every experimental or tooling package is fully stabilized.

## Roadmap

### v0.6.x

- improve reliability across layered and composite primitives
- continue hardening motion, presence, and exit-transition behavior
- build a proper keyboard navigation foundation instead of relying too heavily on Roblox default selection behavior
- strengthen focus restoration, ordered navigation, trapping, and cross-scope keyboard flow
- expand regression coverage and debugging for the stable-direction package surface
- keep feature-limited packages flexible while their API surface is still settling

### v1.0

The `v1.0` milestone is focused on the main stable UI layer, not every package in the workspace.

The priority is to ship:

- a stable foundation around `core`, `focus`, `layer`, `motion`, `style`, and `system`
- dependable composition and state semantics across the main UI primitives
- predictable focus, keyboard navigation, layering, portal, and motion behavior
- clearer semver expectations for packages that are considered part of the stable UI surface

### after v1.0

- continue maturing feature-limited packages independently
- allow experimental or intentionally limited packages to remain in `0.x` if needed
- only promote those packages to stable versioning when their APIs and behavior are actually ready
