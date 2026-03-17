# @lattice-ui/cli

Node CLI for Lattice UI projects.

## Install (Optional Global)

```bash
npm i -g @lattice-ui/cli
```

## Usage

```bash
lattice <command> [options]
```

### Commands

- `lattice create [project-path] [--yes] [--pm <pnpm|npm|yarn>] [--git] [--template rbxts] [--lint] [--no-lint]`
- `lattice add [name...] [--preset <preset...>] [--yes] [--dry-run]`
- `lattice remove [name...] [--preset <preset...>] [--yes] [--dry-run]`
- `lattice upgrade [name...] [--preset <preset...>] [--yes] [--dry-run]`
- `lattice doctor`
- `lattice help`
- `lattice version`

### Global options

- `--help`
- `--version`

### Examples

```bash
npx @lattice-ui/cli create
npx @lattice-ui/cli create my-game --pm npm --git --no-lint
npx @lattice-ui/cli add dialog,toast --preset overlay
npx @lattice-ui/cli remove dialog --dry-run
npx @lattice-ui/cli upgrade --dry-run
npx @lattice-ui/cli doctor
```
