# @lattice-ui/scroll-area

Headless scroll area primitives for Roblox UI with custom scrollbars and thumbs.

## Exports

- `ScrollArea`
- `ScrollArea.Root`
- `ScrollArea.Viewport`
- `ScrollArea.Scrollbar`
- `ScrollArea.Thumb`
- `ScrollArea.Corner`

## Notes

- Supports vertical and horizontal scrollbar primitives.
- `type` supports `auto`, `always`, and `scroll` visibility policies.
- Clicking a scrollbar track and dragging a thumb both update the viewport canvas position.
- Thumb/canvas math helpers are exported for unit testing.
