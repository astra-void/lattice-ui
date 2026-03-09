# @lattice-ui/preview

Preview Roblox-first Lattice UI modules in a source-first React DOM shell.

## Install

```bash
npm install -D @lattice-ui/preview @lattice-ui/cli
```

## Source-First Preview

```bash
npx lattice preview
```

## Workflow

1. Run `lattice preview` from a package root.
2. The preview shell discovers real `src/**/*.tsx` files and renders them directly in the browser.
3. Explicit preview selection prefers `preview.render`, then `preview.entry`.
4. Default export / basename / sole-export inference still exists as a deprecated fallback, and the shell reports a `LEGACY_AUTO_RENDER_FALLBACK` note until the file is migrated.
5. Files that still cannot be resolved to one render target stay in `needs harness`, and the shell reports whether the file has ambiguous exports or no renderable export at all.
6. This package only exposes the source-first preview server and the preview runtime. The browser shell itself is internal.

## Preview Contract

```ts
export const preview = {
  title: "Dialog Root",
  entry: DialogRoot,
  props: {
    defaultChecked: true,
  },
  render: () => <frame />,
};
```

- `title` overrides the sidebar/display title.
- `entry` makes the preview target explicit for direct component renders.
- `props` feeds the `preview.entry` path when discovery can resolve one preview target without a custom harness.
- `render` is the escape hatch for custom harnesses and composed demos.
- `render` wins over `entry` when both are present.

Legacy fallback note:

- Files without `preview.entry` or `preview.render` can still render via default export / basename / sole-export inference for now.
- That inference is deprecated and intentionally surfaced in diagnostics so packages can migrate incrementally.

When discovery cannot follow an import chain past the current `sourceRoot`, the shell keeps the entry previewable when possible and shows a `TRANSITIVE_ANALYSIS_LIMITED` note instead of silently skipping that branch.

## Supported Preview Transform Surface

- Host elements: `frame`, `textbutton`, `screengui`, `textlabel`, `textbox`, `imagelabel`, `scrollingframe`, `uicorner`, `uipadding`, `uilistlayout`, `uigridlayout`, `uistroke`
- Enum values: `TextXAlignment`, `TextYAlignment`, `FillDirection`, `SortOrder`, `AutomaticSize`, `ScrollingDirection`, and the preview key subset used for DOM keyboard events
- Runtime helpers: `@lattice-ui/core`, `@lattice-ui/layer`, and `@lattice-ui/focus` imports are rewritten to `@lattice-ui/preview-runtime`

Unsupported Roblox globals, services, or runtime-only instance patterns fail generation with diagnostics in this format:

```text
<CODE> <file>:<line>:<column> <message>
```
