# @lattice-ui/react-context-menu

Headless right-click / long-press context menu primitives for Roblox UI.

## Exports

- `ContextMenu`
- `ContextMenu.Root`
- `ContextMenu.Trigger`
- `ContextMenu.Portal`
- `ContextMenu.Content`
- `ContextMenu.Item`
- `ContextMenu.Group`
- `ContextMenu.Label`
- `ContextMenu.Separator`
- `useContextMenuItemContext` — `{ highlighted, disabled }` inside an item, for styling item state
- `ContextMenuRoot`, `ContextMenuTrigger`, … (the same parts, by name)

## Notes

- `Trigger` opens the menu on `MouseButton2` or a touch long press, at the pointer position.
  Supports controlled/uncontrolled `open`; `modal` defaults to `true`.
- `Content` is anchored to a 1x1 virtual anchor at the pointer and positioned by
  `@lattice-ui/react-popper`, so it flips and clamps against the viewport (`placement` defaults to
  `bottom`, top-left corner at the pointer).
- Like `Menu.Content`, open content is an ordered, vertical, wrapping `FocusScope`, trapped while
  `modal`; focus moves to the first enabled item on open.
- `Item` runs `onSelect` and then closes the menu unless `event.preventDefault()` is called.
  `highlighted` follows pointer hover or managed focus; the primitive never paints it.
- Dismissal comes from `@lattice-ui/react-layer`'s `DismissableLayer`: an outside pointer press or
  the dismiss key (`ButtonB`, `Backspace`) closes the menu, cancellable through
  `onPointerDownOutside`, `onInteractOutside` and `onEscapeKeyDown`.
- `Content` ships no motion recipe; pass a `transition` (`PresenceMotionConfig`) to animate it.
- Parts set no colors, sizes, fonts or text; they only neutralize Roblox instance defaults.
  Consumer instance props and `Event` handlers pass through, a consumer `ref` reaches the
  rendered instance, and `asChild` slots a part onto the consumer's element.
