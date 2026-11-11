# @lattice-ui/react-tooltip

Headless hover/focus tooltip primitives for Roblox UI.

## Exports

- `Tooltip`
- `Tooltip.Provider`
- `Tooltip.Root`
- `Tooltip.Trigger`
- `Tooltip.Portal`
- `Tooltip.Content`
- `TooltipProvider`, `TooltipRoot`, … (the same parts, by name)

## Notes

- Supports controlled/uncontrolled `open`.
- Hovering the trigger opens after a delay; managed focus on the trigger (from
  `@lattice-ui/react-focus`) opens immediately. Leaving both closes it, as does `disabled`.
- `Provider` is optional and sets `delayDuration` (default `700` ms) and `skipDelayDuration`
  (default `300` ms): within that window after a tooltip opened, the next one opens with at most
  that delay. `Root` can override `delayDuration` per tooltip.
- `Content` is placed against the trigger by `@lattice-ui/react-popper` (`placement`,
  `sideOffset`, `alignOffset`, `collisionPadding`; `bottom` by default).
- `Content` is a non-modal `DismissableLayer` from `@lattice-ui/react-layer`: an outside pointer
  press or the dismiss key (`ButtonB`, `Backspace`) closes it. It is not a `FocusScope` and does
  not take focus.
- `Content` ships no motion recipe; pass a `transition` (`PresenceMotionConfig`) to animate it.
- Parts set no colors, sizes, fonts or text; they only neutralize Roblox instance defaults.
  Consumer instance props and `Event` handlers pass through, a consumer `ref` reaches the
  rendered instance, and `asChild` slots `Trigger` / `Content` onto the consumer's element.
