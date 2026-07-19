# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Register the context-menu and motion packages in the CLI registry so `lattice add context-menu` and `lattice add motion` no longer fail with "Unknown component".

## [0.6.2] - 2026-07-19

This patch repairs CLI scaffolding on npm, where a peer conflict is a hard error, and pins the package manager a project was generated with.

Migration notes:

- Projects scaffolded before this release may still list pre-0.6.1 package names alongside their renamed replacements; run `init` to rewrite them, or `doctor` to see what needs attention.
- TypeScript is now pinned to the version roblox-ts compiles with; `doctor` warns if your project is already on an unsupported major.

### Added

- Pin the resolved package manager in scaffolded projects through the `devEngines` field, so a project generated with one package manager cannot be silently installed with another; `add`, `remove`, and `upgrade` apply the pin before touching dependencies.

### Fixed

- Fix `init` failing outright on npm by pinning TypeScript to a version roblox-ts supports instead of resolving the latest dist-tag.
- Rewrite pre-0.6.1 package names left in existing manifests during `init` instead of resolving them alongside their replacements; `doctor` now reports them and `upgrade` skips them.
- Roll back file changes when `init` or `create` fails, so a failed install no longer leaves a half-written scaffold for the next run to merge on top of.
- Point local command hints at the `lattice-ui` binary, since `npx lattice` does not resolve for npm projects.
- Skip lib checks in the scaffolded `tsconfig` so `typecheck` passes on a freshly scaffolded project.

## [0.6.1] - 2026-07-19

This release moves every package under a framework layer directory so future Vide and plain-Luau targets can sit beside React. It is a rename only: no runtime behavior, exports, or APIs changed.

Migration notes:

- Add the `react-` prefix to every `@lattice-ui/*` import: `@lattice-ui/<name>` is now `@lattice-ui/react-<name>` (for example `@lattice-ui/checkbox` becomes `@lattice-ui/react-checkbox`).
- Replace `@lattice-ui/core` with `@lattice-ui/react-runtime`.
- Update dependency entries in `package.json` to the new published names before upgrading.
- If you pin CLI registry keys, rename the `core` key to `runtime`; all other component keys are unchanged.

### Changed

- **Breaking:** packages now publish as `@lattice-ui/<layer>-<name>` from `packages/<layer>/<name>`, so `@lattice-ui/<name>` becomes `@lattice-ui/react-<name>` and `@lattice-ui/core` becomes `@lattice-ui/react-runtime`.
- **Breaking:** the CLI registry key `core` is now `runtime`; other component keys are unchanged.

## [0.6.0] - 2026-07-19

This release replaces Roblox's native GUI selection navigation with a focus controller Lattice owns, rebuilds the toast lifecycle on presence motion, adds a pointer-anchored context menu, and unifies default motion behind shared tokens.

Migration notes:

- Replace `retainExternalFocusBridge` and `releaseExternalFocusBridge` with `retainNavigation` and `releaseNavigation`; `GuiService.SelectedObject` is now render-only, so changing it externally no longer moves focus.
- Update `Toast.Root`'s `transition` prop from a `ResponseMotionConfig` to a `PresenceMotionConfig` (`initial`/`reveal`/`exit`).
- Review any per-component motion duration or offset overrides — defaults now come from shared motion tokens and several values changed to match.

### Added

- Add a `@lattice-ui/context-menu` package that opens a menu at the pointer, placing and flipping against the cursor instead of a trigger's bounds.
- Open the Combobox option list when the input gains focus, showing the full set until typing narrows it; disabled comboboxes still refuse to open.
- Add an opt-in `truncate` prop to `Text` that ellipsizes single-line overflow.
- Make Select triggers and items, toggle-group items, and accordion triggers gamepad-selectable so pad users can open, move between, and commit on overlay items.
- Add a focus activation guard so a single gamepad or keyboard activation is handled once instead of twice.
- Add a `getCapturesDirectional` focus-node hook so widgets that need an arrow key for themselves (text field and textarea cursors, slider value axis) can opt out per direction.
- Add a toast reveal presence recipe for enter/exit fades that matches the other overlay components.

### Changed

- **Breaking:** directional keyboard and gamepad navigation is now driven by a Lattice-owned controller with hybrid ordered/spatial resolution per focus scope, escaping up the scope chain until a trapped scope stops the walk.
- **Breaking:** `Toast.Root` now takes presence motion config, and toasts fade in, stay visible while their exit animation plays, and are removed only once it finishes.
- Start toast expiry timers when a toast enters the visible window instead of at enqueue time, so toasts queued behind `maxVisible` get their full display duration, and animate `clear()` through the exit transition.
- Source every presence and response motion recipe from shared duration, offset, settle, and drag tokens so timing and travel distance are consistent across components.
- Have Menu and Select declare ordered vertical focus scopes instead of hand-rolling up/down handling.
- Re-promote a dismissable layer to the top of the stack each time it opens so z-order and dismissal order follow open order.

### Removed

- **Breaking:** remove `retainExternalFocusBridge` and `releaseExternalFocusBridge` from `@lattice-ui/focus`, along with the reverse `GuiService.SelectedObject` listener.

### Fixed

- Dismiss layers on outside clicks when no content boundary ref is supplied, instead of treating every pointer position as inside.
- Stop clicking a Popover, Select, or Menu trigger from dismissing the layer it just opened, and stop dropping presses that Roblox marks as sunk by an active GUI element.
- Keep Popper collision math aligned with where content actually renders by resolving a `ScreenGui`'s viewport rect from the GUI inset.
- Fix Combobox filtering so a query actually narrows the option list instead of matching every option.
- Keep the selected Combobox label and the selected Select value after the popup content unmounts.
- Render the Dialog overlay by hosting it in its own `ScreenGui`, so dialog content sits above its dim.
- Preserve the X scale of full-width textareas during auto-resize instead of collapsing them to zero width.
- Re-report avatar loaded status for already-cached textures when the source changes, instead of leaving the avatar blank.
- Stop long animations from settling early on high-refresh clients by advancing motion state only on a successful property write.
- Keep `onChange` retries alive for controlled state, so a parent rejecting a change no longer silently swallows later ones.
- Fix `asChild` composition so a slotted host child keeps its own event handlers and its ref survives React's development warning sentinel.

## [0.5.1] - 2026-07-18

This patch corrects Combobox selection, filtering, and clear behavior so controlled values and reopened lists behave predictably.

Migration notes:

- `onValueChange` now receives `undefined` when the selection is cleared; handle that case if you assume a value is always present.

### Fixed

- Reset the Combobox filter query on close so reopening shows the full item list instead of only the previously selected item.
- Stop async item registration from clobbering a controlled Combobox value; a selection is now only forced when the selected item is registered but disabled.
- Allow clearing a Combobox selection by emptying the input before closing.
- Order registered Combobox items by layout order so the forced-selection fallback picks the visually first item, and refresh cached labels and disabled state when they change.

## [0.5.0] - 2026-04-07

This release extracts shared focus and motion helpers into dedicated packages, expands the CLI's project scaffolding, and standardizes motion behavior across layered primitives.

Migration notes:

- Update any imports that used focus or motion helpers from `@lattice-ui/core` to `@lattice-ui/focus` and `@lattice-ui/motion`.
- If you regenerate projects with the CLI, review the updated pnpm hoisting and theme provider setup before shipping the scaffold.

### Added

- Add a shared `@lattice-ui/motion` package for tween and presence helpers.
- Add a shared `@lattice-ui/focus` package for focus management helpers.
- Add an interactive `init` CLI command for existing projects with safe template merging and JSONC-aware config updates.
- Add scaffold support for `create` and `init` so generated projects can start from the maintained package templates.
- Add `default.project.json` support to package scaffolds so generated projects boot consistently.

### Changed

- Move shared focus and motion helpers out of `@lattice-ui/core` into dedicated package entrypoints.
- Adopt placement-relative Popper positioning options (`placement`, `sideOffset`, `alignOffset`, and `collisionPadding`).
- Expand `usePopper` positioning metadata to expose resolved placement/position state and measured content size (`position`, `anchorPoint`, `placement`, `contentSize`, `isPositioned`, and `update`).
- Update layered components to use the shared motion and focus packages for more consistent interaction and exit behavior.
- Refresh the CLI-generated project scaffold to handle pnpm hoisting and theme provider setup more reliably.
- Make transitions feel consistent across components by sharing the same motion recipes everywhere.
- Keep package metadata, scripts, and published entrypoints aligned with the new package split.

### Fixed

- Keep layered content mounted through motion transitions so exit animations complete instead of flashing or unmounting early.
- Improve Dialog bounds handling and Popper placement so overlays stay aligned when refs or viewport data change, including flip and clamp behavior near viewport edges.
- Keep overlay content visually centered by sizing the positioned wrapper from measured content size.
- Prevent Select and Combobox interaction regressions by restoring focus and avoiding first-frame content flashes.
- Normalize slider and switch thumb anchors, then smooth out the remaining motion timing in Tooltip, Tabs, Checkbox, Radio Group, Progress, Accordion, and Textarea.

## [0.4.4] - 2026-03-22

This patch completes the CLI package rename so generated files, docs, and workspace tooling consistently target the published `lattice-ui` package.

Migration notes:

- Replace any remaining `@lattice-ui/cli` install or script references with `lattice-ui`.

### Fixed

- Update the CLI docs, generated templates, and command output to use the published `lattice-ui` package name consistently.
- Fix workspace tooling classification so the renamed `lattice-ui` package is handled correctly by workspace policy checks.

## [0.4.3] - 2026-03-22

This release renames the published CLI package to `lattice-ui` so installation and upgrade flows match the supported package name.

Migration notes:

- Replace `@lattice-ui/cli` with `lattice-ui` in install commands, scripts, and automation before upgrading.

### Changed

- Rename the published CLI package from `@lattice-ui/cli` to `lattice-ui`.

## [0.4.2] - 2026-03-22

### Added

- Add automatic package manager detection across CLI commands so `create`, `init`, and related flows adapt to the project's existing npm, pnpm, or yarn setup.

## [0.4.1] - 2026-03-22

### Fixed

- Fix CLI scaffolding for pnpm-based projects by wiring the generated setup for hoisting and the theme provider more reliably.

## [0.4.0] - 2026-03-20

This release narrows the workspace to the maintained UI package surface, adds shared focus-management primitives, and improves interaction reliability across layered and composite components.

Migration notes:

- If you depended on the preview, compiler, preview-runtime, preview-engine, or layout-engine workspace packages, upgrade to the maintained component packages and CLI entrypoints only.
- If you relied on `SwitchThumb` `forceMount` or the legacy roving-focus example flows, remove those assumptions before upgrading.

### Added

- Add a `create` command to the CLI for scaffolding workspace packages from the bundled templates.
- Add core focus manager primitives to coordinate focus registration, ordering, and restoration across interactive components.
- Add direct `ScrollArea` track-click and thumb-drag interactions for moving the viewport.

### Changed

- Rework layered and composite components to share the new focus manager across accordion, dialog, menu, popover, radio group, select, and tabs.
- Narrow the supported workflow to the maintained component packages and CLI entrypoints.
- Improve workspace reliability for repeated builds and incremental execution across the monorepo.

### Removed

- Drop the unsupported preview and layout tooling surface from this release.
- Remove deprecated `SwitchThumb` `forceMount` behavior and the legacy roving-focus example flows.

### Fixed

- Improve focus restoration, modal trapping, and layer coordination across Dialog, Menu, Popover, Select, Radio Group, and Tabs.
- Fix Select and Combobox interaction behavior by restoring trigger focus more reliably, disabling Roblox native text-selection interference, and keeping popup anchoring aligned with the input.
- Fix Tooltip trigger state handling so hover and focus activity cooperate correctly and disabled triggers close cleanly.
- Fix Textarea auto-resize sizing by measuring text bounds, line height, and vertical padding more accurately.
