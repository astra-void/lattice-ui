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
- `lattice preview`
- `lattice doctor`
- `lattice help`
- `lattice version`

### Global options

- `--help`
- `--version`

### Examples

```bash
npx lattice create
npx lattice create my-game --pm npm --git --no-lint
npx lattice add dialog,toast --preset overlay
npx lattice remove dialog --dry-run
npx lattice upgrade --dry-run
npx lattice doctor
npx lattice preview
```

### Preview Notes

- Run `lattice preview` from a package root. The CLI infers `<cwd>/src` and indexes real `src/**/*.tsx` files.
- Files with one unambiguous component export are auto-rendered.
- Files can opt into a custom harness with `export const preview = { title?, props?, render? }`.
