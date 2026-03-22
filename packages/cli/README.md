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
- `lattice help`
- `lattice version`

### Global options

- `--help`
- `--version`

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
