# Contributing to Lattice UI

Thanks for your interest in Lattice UI. This document covers how to set the repository up, how to
make a change that fits the project's conventions, and what is expected before a pull request.

Lattice UI is a headless-first UI toolkit for Roblox built with [roblox-ts](https://roblox-ts.com/)
and [`@rbxts/react`](https://github.com/littensy/rbxts-react). Most conventions here follow from
that: primitives own behavior, consumers own visuals.

[AGENTS.md](AGENTS.md) is the long-form version of the repository conventions (headless philosophy,
motion rules, navigation and focus rules, validation expectations). It is written for coding agents,
but it is the authoritative reference for humans too — read it before a non-trivial change.

## Prerequisites

- **Node.js 24** — the version CI runs on.
- **pnpm 11.6.0** — pinned via the `packageManager` field. `corepack enable` picks it up
  automatically.
- **[Rokit](https://github.com/rojo-rbx/rokit)** — optional, only needed for Roblox-side work. It
  installs the pinned `rojo` and `run-in-roblox` from [rokit.toml](rokit.toml):

  ```bash
  rokit install
  ```

- **Roblox Studio** — optional, for manual verification in the playground or for the TestEZ harness.

Unit tests, typecheck, lint and build all run without Roblox Studio installed.

## Getting started

```bash
git clone https://github.com/astra-void/lattice-ui.git
cd lattice-ui
pnpm install
pnpm run check
```

`pnpm run check` is the aggregate gate: workspace policy check, lint, typecheck, and unit tests. If
it passes on a clean checkout, your environment is set up correctly.

## Repository layout

This is a [pnpm](https://pnpm.io/) monorepo managed with [Turbo](https://turbo.build/).

| Path | What it is |
| --- | --- |
| `packages/react/*` | Publishable React packages, published as `@lattice-ui/react-<name>` |
| `packages/tools/cli` | The `lattice-ui` CLI |
| `apps/playground` | Roblox playground for manual UI verification |
| `apps/playground-vela` | Styling-comparison clone of the playground, scenes styled with `vela-rbxts` `className` utilities instead of `react-style` |
| `apps/test-harness` | Roblox TestEZ harness for package-level behavior checks |
| `apps/loom-preview` | Typecheck-only preview integration workspace |
| `tests/vitest/*` | Node-side unit tests (Vitest) |
| `scripts/*` | Workspace policy, changeset and release scripts |

Package public surface is driven from each package's `src/index.ts`. Package layout, manifest fields
and required files are enforced by [workspace.policy.json](workspace.policy.json) — see
[Workspace policy](#workspace-policy).

## Everyday commands

Run these from the repository root; prefer root commands over package-local ones unless the task is
explicitly package-local.

```bash
pnpm run build       # build all publishable packages (rbxtsc)
pnpm run watch       # rebuild on change
pnpm run typecheck   # type-check the workspace
pnpm run test        # unit tests (Vitest)
pnpm run lint        # Biome + ESLint
pnpm run lint:fix    # auto-fix and format
pnpm run check:fast  # workspace check + lint + typecheck
pnpm run check       # check:fast + unit tests
```

## Design principles

The rules below are the ones most likely to come up in review. [AGENTS.md](AGENTS.md) explains each
in full.

**Headless first.** A primitive owns behavior, state orchestration and composition. It may set
behavior props and neutralize Roblox instance defaults that would otherwise impose a look nobody
asked for (`BackgroundTransparency: 1`, `BorderSizePixel: 0`, `Text: ""`, `AutoButtonColor: false`).
It may not set colors, static sizes, fonts, text content, or decorative `UICorner` / `UIStroke` /
`UIPadding` children.

**Geometry from state is behavior, not appearance.** Progress fill ratios, slider thumb travel,
popper-driven position, scroll thumb size, and presence-driven `Visible` belong in the primitive.

**Spread order is fixed:** neutral defaults, then consumer passthrough, then behavior props. That is
what lets a consumer override defaults but never the behavior. Compose consumer `Event` handlers and
refs rather than replacing them.

**Motion flows through `@lattice-ui/react-motion`.** Use the existing recipes and hooks
(`usePresenceMotion`, `useResponseMotion`, `useFeedbackEffect`). Do not add per-frame interpolation,
custom schedulers, or direct Roblox animation service usage in consuming packages, and do not mirror
animation progress back into React state. If a primitive needs new motion behavior, extend
`packages/react/motion` instead of hand-rolling it locally. Primitives ship no default motion recipes
— presence *timing* is owned by the primitive, animation arrives via `transition`.

**Focus and navigation flow through `@lattice-ui/react-focus`.** Lattice ships its own directional
navigation and deliberately does not use Roblox's native GUI selection navigation. Do not set
`NextSelection*`, `SelectionGroup` or `GuiService.AutoSelectGuiEnabled` to drive navigation, do not
read or write `GuiService.SelectedObject` outside the focus package (it is a render-only output), and
do not bind `ContextActionService` / `UserInputService` for focus movement elsewhere. Wrap navigable
regions in a `FocusScope`, register nodes with `useFocusNode`, and use `getCapturesDirectional` when
a widget must consume an arrow key itself.

**This is not a browser React app.** There is no DOM, no CSS, and no `window` / `document`. Use
Roblox GUI concepts (`UDim2`, `Vector2`, `Frame`, `GuiObject`, `ScreenGui`) and explicit
instance props.

**Fix bugs in the narrowest responsible surface.** If the bug belongs to the primitive, fix the
primitive — not the playground scene that surfaced it. Prefer minimal diffs over rewrites, and avoid
unrelated cleanup in files outside the scope of the change.

## Testing

### Unit tests (Vitest)

Node-side tests live in `tests/vitest/<area>/*.test.ts(x)` and run without Roblox:

```bash
pnpm run test:unit
pnpm run test:unit:watch
```

Things worth knowing before writing one:

- Roblox globals are shimmed in [tests/vitest/setup/roblox-shim.ts](tests/vitest/setup/roblox-shim.ts)
  (loaded as a setup file) and `@rbxts/services` is aliased to
  [tests/vitest/setup/rbxts-services.ts](tests/vitest/setup/rbxts-services.ts). `@rbxts/react` is
  aliased to `react`. Extend the shim rather than working around it.
- The `@lattice-ui/*` alias in [vitest.config.mts](vitest.config.mts) resolves the **package root**
  only (`@lattice-ui/react-focus` → `packages/react/focus/src`). To test an internal module that is
  not exported from `src/index.ts`, import it by relative path
  (`../../../packages/react/popper/src/compute`) instead of a package subpath.
- Test files generally use `// @ts-nocheck` because the sources are written against Roblox ambient
  types, and `// @vitest-environment jsdom` when they render with `@testing-library/react`.

### Roblox harness (TestEZ)

`apps/test-harness` covers behavior that needs a real Roblox runtime. Test modules live in
`apps/test-harness/src/tests/**/*.spec.tsx`, shared helpers in `apps/test-harness/src/test-utils`.

```bash
pnpm run test:rbx           # typecheck + build the harness (no external launch)
pnpm run test:rbx:place     # also build test-harness.rbxlx
pnpm run test:rbx:headless  # build a place and run it via run-in-roblox
pnpm run test:rbx:run       # build a place and open it for Studio-assisted runs
```

Close any open Roblox Studio windows before `test:rbx:headless` or `test:rbx:run` so
`run-in-roblox` can open the generated place cleanly. The harness is not wired into CI; treat it as
local verification. See [apps/test-harness/README.md](apps/test-harness/README.md) for details.

### Playground (manual verification)

`apps/playground` is the primary surface for looking at a primitive in a real Roblox client. Scenes
live in `apps/playground/src/client/scenes` and are registered in
[PlaygroundWorkspace.tsx](apps/playground/src/client/PlaygroundWorkspace.tsx).

```bash
pnpm --filter @lattice-ui/playground watch
rojo serve apps/playground/default.project.json
```

Then connect from the Rojo plugin in Studio and press Play. Add a scene when a change is easier to
review by looking at it — but a playground scene is a demonstration surface, not a place to work
around a primitive bug.

Be honest about what you actually ran: if you did not execute anything in Roblox, describe your
conclusions as static reasoning rather than runtime verification.

## Workspace policy

Package manifests, lockedstep versions, required files, canonical scripts, peer dependencies and the
hand-maintained tsconfig path maps are enforced by `pnpm run workspace:check` (a CI job of its own —
nothing else in CI would notice them drifting).

- `pnpm run workspace:sync` rewrites manifests and generated tsconfigs to the canonical shape, and
  adds missing packages to the `paths` maps in `tsconfig.eslint.json` and `apps/*/tsconfig.json`.
- `pnpm run workspace:check` verifies them; it fails with a list of exactly what drifted.

Keep internal `@lattice-ui/*` dependencies on `workspace:*`, and do not hand-edit package versions —
the changeset/release flow owns those.

### Adding a new package

Use the generator rather than copying a directory by hand:

```bash
pnpm run package:new --name <kebab-name> --layer react --deps react-runtime,react-focus --app-link both
```

Then run `pnpm run workspace:sync` and `pnpm run workspace:check`. `--app-link` wires the package
into the playground and/or test harness.

## Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/), matching the existing history:
`type(scope): summary`.

- Types in use: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`.
- Scope is the package or app name without the `@lattice-ui/` prefix — `focus`, `popper`,
  `playground`, `test-harness` — or omitted for repo-wide changes.
- Keep the summary imperative and lowercase, and make one logical change per commit.

Examples from the log:

```
fix(switch): center the thumb in its track
refactor(playground): give the switch scene a track inset
fix(react): drop the dead props.ref read in Slot
```

## Changesets

Any user-facing change to a publishable package under `packages/<layer>/<name>` needs a changeset:

```bash
pnpm run changeset:add
```

Internal-only, scene-only, tooling and docs changes usually do not. Skip it only when the change has
zero package impact.

All publishable packages move together in one **lockedstep** group, so a bump to one bumps all of
them; the project stays on `0.x` until the coordinated `v1.0.0` milestone. Pick the bump for the
package you actually changed and let the group follow.

Write the changeset body as release notes for a consumer: what changed, and what it means for code
that depends on the old behavior.

## Pull requests

Before opening a PR:

1. `pnpm run lint:fix`, then confirm `pnpm run lint` is clean.
2. `pnpm run typecheck` passes.
3. `pnpm run test:unit` passes for behavior changes, and new behavior has a test.
4. `pnpm run check` as the single aggregate gate if you prefer one command.
5. A changeset is added if a publishable package changed.
6. Package `README.md`, exports and types are updated when the public surface changes.

In the PR description, say what changed, why that package was the right place for it, and what you
actually ran — distinguishing verified from not run. CI runs `workspace`, `lint`, `build`,
`typecheck` and `test-unit` on every pull request; all five must pass.

Release preparation and publishing are maintainer-only (`pnpm run release:prepare` /
`release:publish`, plus the tag-triggered Publish workflow). Contributors should never run publish
commands, edit versions, or apply release changes in a PR.

## Reporting issues

Open an issue at [github.com/astra-void/lattice-ui/issues](https://github.com/astra-void/lattice-ui/issues).
For a bug, the most useful report includes:

- the package and version you are on,
- a minimal reproduction — ideally as a playground scene or a snippet using only Lattice primitives,
- what you expected versus what happened, and whether it is a focus, layering, presence/motion or
  positioning issue (those interact, and knowing which one you suspect helps),
- your Roblox environment if relevant (Studio versus live client, gamepad versus keyboard).

Because Lattice UI is headless, "it looks wrong" is usually a styling question and "it behaves
wrong" is usually a primitive bug — say which one you think you are hitting.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
