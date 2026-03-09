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
3. Files with one unambiguous component export auto-render, even without `export const preview`.
4. Files with multiple component exports are marked as ambiguous until you add a default export or `preview.render`.
5. Files that need composition can opt in with `export const preview = { title?, props?, render? }`, and the shell now reports why a file still needs a harness or where transitive analysis stopped.
6. This package only exposes the source-first preview server and the preview runtime. The browser shell itself is internal.

## Preview Contract

```ts
export const preview = {
  title: "Dialog Root",
  props: {
    defaultChecked: true,
  },
  render: () => <frame />,
};
```

- `title` overrides the sidebar/display title.
- `props` feeds the default auto-render path when the file already has one unambiguous component export.
- `render` is the escape hatch for custom harnesses and composed demos.

When discovery cannot follow an import chain past the current `sourceRoot`, the shell keeps the entry previewable when possible and shows a `TRANSITIVE_ANALYSIS_LIMITED` note instead of silently skipping that branch.

## Supported Preview Transform Surface

- Host elements: `frame`, `textbutton`, `screengui`, `textlabel`, `textbox`, `imagelabel`, `scrollingframe`, `uicorner`, `uipadding`, `uilistlayout`, `uigridlayout`, `uistroke`
- Enum values: `TextXAlignment`, `TextYAlignment`, `FillDirection`, `SortOrder`, `AutomaticSize`, `ScrollingDirection`, and the preview key subset used for DOM keyboard events
- Runtime helpers: `@lattice-ui/core`, `@lattice-ui/layer`, and `@lattice-ui/focus` imports are rewritten to `@lattice-ui/preview-runtime`

Unsupported Roblox globals, services, or runtime-only instance patterns fail generation with diagnostics in this format:

```text
<CODE> <file>:<line>:<column> <message>
```
