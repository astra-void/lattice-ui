# @lattice-ui/react-popover

Headless anchored popover primitives for Roblox UI.

## Exports

- `Popover`
- `Popover.Root`
- `Popover.Trigger`
- `Popover.Anchor`
- `Popover.Portal`
- `Popover.Content`
- `Popover.Close`
- `PopoverRoot`, `PopoverTrigger`, … (the same parts, by name)

## Notes

- Supports controlled/uncontrolled `open`. `modal` defaults to `false`.
- `Trigger` toggles the popover; `Close` closes it. Both activate on click and on
  keyboard/gamepad activation.
- `Content` is placed by `@lattice-ui/react-popper` (`placement`, `sideOffset`, `alignOffset`,
  `collisionPadding`; `bottom` by default) against `Anchor` when one is rendered, else the trigger.
- Open content is a `FocusScope` from `@lattice-ui/react-focus` that restores focus on close and
  is trapped only while `modal`.
- Dismissal comes from `@lattice-ui/react-layer`'s `DismissableLayer`: an outside pointer press or
  the dismiss key (`ButtonB`, `Backspace`) closes the popover. `onPointerDownOutside`,
  `onInteractOutside` and `onEscapeKeyDown` can `preventDefault()` it. Presses on the trigger and
  the anchor count as inside.
- `Content` ships no motion recipe; pass a `transition` (`PresenceMotionConfig`) to animate it.
- Parts set no colors, sizes, fonts or text; they only neutralize Roblox instance defaults.
  Consumer instance props and `Event` handlers pass through, a consumer `ref` reaches the
  rendered instance, and `asChild` slots a part onto the consumer's element.
