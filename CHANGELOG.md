# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Add an interactive `init` CLI command that bootstraps Lattice into existing projects with safe template merging, dry-run planning, and JSONC-aware config updates.

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
