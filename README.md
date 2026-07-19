# Lattice UI

A headless-first UI toolkit for Roblox, built with [roblox-ts](https://roblox-ts.com/) and [`@rbxts/react`](https://github.com/littensy/rbxts-react).

Lattice UI ships composable primitives that own interaction, focus flow, layering, portals, presence, and motion — while leaving visual styling up to you. Primitives are unstyled or minimally styled by design, so you can drop them into any project and bring your own look.

## Highlights

- **Headless-first** — primitives own behavior and state orchestration, not opinionated visuals.
- **Composable** — small wrappers and slotting patterns over monolithic components.
- **Focus & layering** — deliberate focus restoration, ordered navigation, trapping, portals, and overlay stacking.
- **Motion built in** — presence, feedback, and response motion flow through `@lattice-ui/motion`, with reduced-motion policy support.
- **Controlled & uncontrolled** — consistent state semantics across primitives.

## Installation

The fastest way to start is the CLI, which can scaffold a new project or add Lattice UI to an existing roblox-ts app:

```bash
# Scaffold a new project
npx lattice-ui create my-game

# Or add Lattice UI to an existing roblox-ts project
npx lattice-ui init
npx lattice-ui add dialog tooltip toast
```

Packages can also be installed directly:

```bash
npm install @lattice-ui/core @lattice-ui/dialog
```

All primitives depend on `@rbxts/react` and `@rbxts/react-roblox` (React 17) as peer dependencies.

See the [CLI reference](packages/cli/README.md) for the full command set (`create`, `init`, `add`, `remove`, `upgrade`, `doctor`).

## Packages

### Foundations

`core`, `focus`, `layer`, `motion`, `style`, `system`

### UI primitives

`accordion`, `avatar`, `checkbox`, `combobox`, `dialog`, `menu`, `popover`, `popper`, `progress`, `radio-group`, `scroll-area`, `select`, `slider`, `switch`, `tabs`, `text-field`, `textarea`, `toast`, `toggle-group`, `tooltip`

### Tooling

`cli`

## Development

This is a [pnpm](https://pnpm.io/) monorepo managed with [Turbo](https://turbo.build/).

```bash
pnpm install        # install dependencies
pnpm run build      # build all publishable packages
pnpm run typecheck  # type-check the workspace
pnpm run test       # run unit tests (Vitest)
pnpm run lint       # lint
pnpm run check      # workspace check + lint + typecheck + tests
```

Workspaces:

- `packages/*` — publishable UI packages and the CLI.
- `apps/playground` — Roblox playground for manual UI verification.
- `apps/test-harness` — Roblox TestEZ harness for package-level behavior checks.
- `apps/loom-preview` — typecheck-only preview integration workspace.

See [AGENTS.md](AGENTS.md) for repository conventions and contribution guidance.

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

## License

[MIT](LICENSE) © astra-void
