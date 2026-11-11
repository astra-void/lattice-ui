# @lattice-ui/react-dialog

Headless modal dialog primitives for Roblox UI.

## Exports

- `Dialog`
- `Dialog.Root`
- `Dialog.Trigger`
- `Dialog.Portal`
- `Dialog.Overlay`
- `Dialog.Content`
- `Dialog.Close`
- `DialogRoot`, `DialogTrigger`, … (the same parts, by name)

## Notes

- Supports controlled/uncontrolled `open`. `modal` defaults to `true` and blocks pointer input
  outside the dialog.
- `Trigger` opens and `Close` closes; both activate on click and on keyboard/gamepad activation.
- `Content` wraps its children in a `FocusScope` from `@lattice-ui/react-focus`. `trapFocus` and
  `restoreFocus` both default to `true`, so focus stays inside while open and returns afterwards.
- Dismissal comes from `@lattice-ui/react-layer`'s `DismissableLayer`: a pointer press outside
  `Content`'s first child, or the dismiss key (`ButtonB`, `Backspace`), closes the dialog.
  `onPointerDownOutside`, `onInteractOutside` and `onEscapeKeyDown` can `preventDefault()` it.
  Further top-level children of `Content` count as inside.
- `Content` spans its layer so children lay out inside it; it does not position itself with
  `@lattice-ui/react-popper`.
- `Overlay` is a full-screen, transparent `TextButton` in its own `ScreenGui` below the content
  layer; it blocks input and closes the dialog when pressed. Give it a color yourself.
- `Content` ships no motion recipe; pass a `transition` (`PresenceMotionConfig`) to animate it.
  `Overlay` has no `transition`; animate an `asChild` overlay instead.
- Parts set no colors, sizes, fonts or text; they only neutralize Roblox instance defaults.
  Consumer instance props and `Event` handlers pass through, a consumer `ref` reaches the
  rendered instance, and `asChild` slots a part onto the consumer's element.
