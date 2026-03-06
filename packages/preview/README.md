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
3. Files with one unambiguous component export auto-render.
4. Files that need composition can opt in with `export const preview = { title?, props?, render? }`.

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

## Legacy Generation

These legacy commands remain available for compatibility:

```bash
npx lattice preview init --target checkbox=packages/checkbox/src --app-dir preview
npx lattice preview generate --target checkbox=packages/checkbox/src --app-dir preview
```

## Supported Preview Transform Surface

- Host elements: `frame`, `textbutton`, `screengui`, `textlabel`, `textbox`, `imagelabel`, `scrollingframe`, `uicorner`, `uipadding`, `uilistlayout`, `uigridlayout`, `uistroke`
- Enum values: `TextXAlignment`, `TextYAlignment`, `FillDirection`, `SortOrder`, `AutomaticSize`, `ScrollingDirection`, and the preview key subset used for DOM keyboard events
- Runtime helpers: `@lattice-ui/core`, `@lattice-ui/layer`, and `@lattice-ui/focus` imports are rewritten to `@lattice-ui/preview/runtime`

Unsupported Roblox globals, services, or runtime-only instance patterns fail generation with diagnostics in this format:

```text
<CODE> <file>:<line>:<column> <message>
```
