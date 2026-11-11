# @lattice-ui/react-radio-group

Headless single-choice radio group primitives for Roblox UI.

## Exports

- `RadioGroup`
- `RadioGroup.Root`
- `RadioGroup.Item`
- `RadioGroup.Indicator`
- `RadioGroupRoot`, `RadioGroupItem`, `RadioGroupIndicator` (the same parts, by name)

## Notes

- Supports controlled/uncontrolled `value` (`value` / `defaultValue` / `onValueChange`).
  `disabled` on the root disables every item; `disabled` on an item disables only that item.
- Items select on activation (click, ButtonA, Enter/Space).
- `orientation` (`"vertical"` by default, or `"horizontal"`) picks the arrow keys that move to the
  previous/next enabled item. Unlike ToggleGroup, moving focus also selects the item.
- Inside a `FocusScope`, selection follows focus only when the user moved it (`source`
  `"navigation"`); programmatic focus, such as a Dialog seeding its first item, does not change
  the value. Inline groups outside any scope handle their own arrow keys.
- `Indicator` mounts while its item is checked. It ships no motion recipe; pass a `transition` to
  animate it, or `forceMount` to keep it mounted.
- Parts set no colors, sizes, fonts or text; they only neutralize Roblox instance defaults.
  Consumer instance props and `Event` handlers pass through, a consumer `ref` reaches the
  rendered instance, and `asChild` slots `Item` / `Indicator` onto the consumer's element.
- `required` is stored on the root context only; the primitive does not enforce it.
