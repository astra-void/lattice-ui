# Lattice UI

A headless-first UI toolkit for Roblox, built with [roblox-ts](https://roblox-ts.com/) and [`@rbxts/react`](https://github.com/littensy/rbxts-react).

Lattice UI ships composable primitives that own interaction, focus flow, layering, portals, and presence — while leaving visual styling entirely up to you. Primitives are unstyled: they set behavior and neutralize Roblox's instance defaults, and nothing else. Style them by passing instance props straight through, or by slotting your own element with `asChild`.

## Highlights

- **Headless-first** — primitives own behavior and state orchestration, not opinionated visuals.
- **Composable** — small wrappers and slotting patterns over monolithic components.
- **Focus & layering** — deliberate focus restoration, ordered navigation, trapping, portals, and overlay stacking.
- **Unstyled, not unusable** — every part forwards instance props to what it renders, so styling never requires `asChild`; consumer props win over defaults, and consumer event handlers compose with the primitive's rather than replacing them.
- **Motion is opt-in** — presence timing is owned by the primitives, but animation flows through `@lattice-ui/react-motion` only when you pass a `transition`, with reduced-motion policy support.
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
npm install @lattice-ui/react-runtime @lattice-ui/react-dialog
```

All primitives depend on `@rbxts/react` and `@rbxts/react-roblox` (React 17) as peer dependencies.

See the [CLI reference](packages/tools/cli/README.md) for the full command set (`create`, `init`, `add`, `remove`, `upgrade`, `doctor`).

## Packages

### Foundations

`react-runtime`, `react-focus`, `react-layer`, `react-motion`, `react-style`, `react-system`

### UI primitives

`react-accordion`, `react-avatar`, `react-checkbox`, `react-combobox`, `react-context-menu`, `react-dialog`, `react-menu`, `react-popover`, `react-popper`, `react-progress`, `react-radio-group`, `react-scroll-area`, `react-select`, `react-slider`, `react-switch`, `react-tabs`, `react-text-field`, `react-textarea`, `react-toast`, `react-toggle-group`, `react-tooltip`

### Tooling

`cli` (published as `lattice-ui`)

## Styling

Primitives set behavior and neutralize Roblox's instance defaults; everything visual is yours. There are three ways in, and they compose:

- **Instance props** — anything a part does not recognize is forwarded to the instance it renders, so `<Menu.Item BackgroundColor3={...} />` works without `asChild`. Forwarded props are checked against that instance, so a prop it does not accept is a compile error rather than a silent no-op.
- **Child instances** — `UICorner`, `UIPadding`, `UIListLayout` and the rest can be written as children of any part, including next to an `asChild` element, where they are re-parented under it.
- **`asChild`** — render your own element and let the part merge its behavior props, events and refs onto it.

### Props the primitive owns

A part applies its own props *after* yours, so the ones below are ignored rather than merged. This is silent: passing them is not an error, they just have no effect. Change the state they are derived from instead, or move your value to a wrapper you control.

Three rules cover most of it:

- **`Active` and `Selectable`** are owned by every interactive part and derive from `disabled`.
- **`Visible`** is owned by every part with open/checked/present state, including all `Content` and `Indicator` parts. Presence keeps content mounted through an exit transition, and `Visible` is how that is expressed.
- **`Text`** is owned by parts that render a controlled value: `TextField.Input`, `Textarea.Input`, `Combobox.Input`, `Select.Value` and `Combobox.Value`. Those inputs also own `TextEditable` and `ClearTextOnFocus`. `Avatar.Image` owns `Image` the same way, from `src`.

Beyond those, geometry is owned wherever the primitive computes it:

| Part | Owned props | Computed from |
| --- | --- | --- |
| every `Content` part | `Size`, `AutomaticSize` | popper measurement — see the note below |
| `Menu.Content`, `ContextMenu.Content`, `Combobox.Content`, `Tooltip.Content` | `Position` | popper placement, applied to the host that wraps the content |
| `Dialog.Content` | `Size` | full-screen host sizing |
| `Dialog.Overlay` | `Size`, `ZIndex` | full-screen hit-testing, stacking below content |
| `Progress.Indicator` | `Size` | `value` / `max` fill ratio |
| `Slider.Range` | `Size`, `Position` | value-to-percent mapping |
| `Slider.Thumb` | `AnchorPoint` | thumb travel |
| `Switch.Thumb` | `Position`, `AnchorPoint` | checked-state travel; your `Size` is read, not ignored — it sizes the wrapper the thumb travels in |
| `ScrollArea.Thumb` | `Size`, `Position` | viewport-to-canvas ratio |
| `ScrollArea.Viewport` | `CanvasSize`, `AutomaticCanvasSize`, `ScrollingDirection`, `ScrollBarThickness`, `ScrollBarImageTransparency` | canvas measurement; the native scrollbar is suppressed because `ScrollArea` renders its own |

`Slider.Range`, `Progress.Indicator` and `Switch.Thumb` write their geometry through motion rather than props, so it is reapplied on every frame even when you pass a value.

`Size` and `AutomaticSize` on a `Content` part are only owned on the default path, where the primitive measures the instance it renders so the popper can place it. Under `asChild` the measurement moves to the host that wraps your element and your own `Size` is left alone — so `asChild` is how you get a fixed-width dropdown:

```tsx
<Select.Content asChild>
  <frame Size={UDim2.fromOffset(160, 0)} AutomaticSize={Enum.AutomaticSize.Y} />
</Select.Content>
```

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

- `packages/react/*` — publishable React packages (`@lattice-ui/react-<name>`).
- `packages/tools/cli` — the `lattice-ui` CLI.
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

- foundations: `react-runtime`, `react-focus`, `react-layer`, `react-motion`, `react-style`, `react-system`
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
