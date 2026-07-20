# lattice-ui

Node CLI for Lattice UI projects.

## Install (Optional Global)

```bash
npm i -g lattice-ui
```

## Usage

```bash
lattice <command> [options]
```

### Commands

- `lattice create [project-path] [--yes] [--pm <pnpm|npm|yarn>] [--git] [--template rbxts] [--lint] [--no-lint]`
- `lattice init [--yes] [--dry-run] [--pm <pnpm|npm|yarn>] [--template rbxts] [--lint]`
- `lattice add [name...] [--preset <preset...>] [--pm <pnpm|npm|yarn>] [--yes] [--dry-run]`
- `lattice remove [name...] [--preset <preset...>] [--pm <pnpm|npm|yarn>] [--yes] [--dry-run]`
- `lattice upgrade [name...] [--preset <preset...>] [--pm <pnpm|npm|yarn>] [--yes] [--dry-run]`
- `lattice doctor [--pm <pnpm|npm|yarn>]`
- `lattice help [command]`
- `lattice version`

Every command has its own help page. `lattice add --help` and `lattice remove --help` also print the
full list of available components and presets, so there is no need to start a run to discover them.

```bash
lattice add --help
lattice help add     # same output
```

### Global options

- `-h`, `--help`
- `-v`, `--version`
- `--verbose` — print debug-level progress output
- `-y` is accepted everywhere `--yes` is

Colour output follows `NO_COLOR` and `FORCE_COLOR`; `NO_COLOR` wins when both are set.

### Examples

```bash
npx lattice-ui create
npx lattice-ui create my-game --pm npm --git --no-lint
npx lattice-ui init --dry-run
npx lattice-ui add dialog,toast --preset overlay
npx lattice-ui remove dialog --dry-run
npx lattice-ui upgrade --dry-run
npx lattice-ui doctor
```

When `--pm` is omitted, the CLI resolves a package manager automatically from the project lockfile or installed managers. Use `--pm` to override that choice explicitly.
