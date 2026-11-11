# @lattice-ui/react-menu

Headless dropdown menu primitives for Roblox UI.

## Exports

- `Menu`
- `Menu.Root`
- `Menu.Trigger`
- `Menu.Portal`
- `Menu.Content`
- `Menu.Item`
- `Menu.Group`
- `Menu.Label`
- `Menu.Separator`
- `useMenuItemContext` — `{ highlighted, disabled }` inside a `Menu.Item`, for styling item state
- `MenuRoot`, `MenuTrigger`, … (the same parts, by name)

## Notes

- Supports controlled/uncontrolled `open`. `modal` defaults to `true`.
- Open content is an ordered, vertical, wrapping `FocusScope` from `@lattice-ui/react-focus`,
  trapped while `modal`. Focus moves to the first enabled item on open and returns to the trigger
  on close.
- `Item` runs `onSelect` on click or keyboard/gamepad activation and then closes the menu; call
  `event.preventDefault()` to keep it open. `highlighted` is true while the pointer hovers the
  item or it holds managed focus; the primitive never paints it.
- Dismissal comes from `@lattice-ui/react-layer`'s `DismissableLayer`: an outside pointer press or
  the dismiss key (`ButtonB`, `Backspace`) closes the menu. `onPointerDownOutside`,
  `onInteractOutside` and `onEscapeKeyDown` can `preventDefault()` it. Presses on the trigger
  count as inside.
- `Content` is placed against the trigger by `@lattice-ui/react-popper` (`placement`,
  `sideOffset`, `alignOffset`, `collisionPadding`; `bottom` by default).
- `Content` ships no motion recipe; pass a `transition` (`PresenceMotionConfig`) to animate it.
- Parts set no colors, sizes, fonts or text; they only neutralize Roblox instance defaults.
  Consumer instance props and `Event` handlers pass through, a consumer `ref` reaches the
  rendered instance, and `asChild` slots a part onto the consumer's element.
