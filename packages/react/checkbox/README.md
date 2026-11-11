# @lattice-ui/react-checkbox

Headless checkbox primitives for Roblox UI with an indeterminate state.

## Exports

- `Checkbox`
- `Checkbox.Root`
- `Checkbox.Indicator`
- `useCheckboxContext` — `{ checked, setChecked, disabled, required }` for styling parts by state
- `CheckboxRoot`, `CheckboxIndicator` (the same parts, by name)

## Notes

- `checked` is `boolean | "indeterminate"` and supports controlled/uncontrolled use
  (`checked` / `defaultChecked` / `onCheckedChange`).
- `Root` renders a `TextButton` and toggles on `Activated`; an indeterminate checkbox becomes
  `true`. `disabled` blocks toggling and makes the root non-selectable.
- `Root` registers a focus node, so the `@lattice-ui/react-focus` navigation controller can reach
  it inside a `FocusScope` (a Dialog, a Popover).
- `Indicator` mounts while `checked` is `true` or `"indeterminate"`. It ships no motion recipe;
  pass a `transition` to animate it, or `forceMount` to keep it mounted.
- Parts set no colors, sizes, fonts or text. They only neutralize Roblox instance defaults
  (`BackgroundTransparency`, `BorderSizePixel`, `Text`, `AutoButtonColor`); consumer instance
  props and `Event` handlers pass through, and a consumer `ref` reaches the rendered instance.
- `asChild` slots either part onto the consumer's element instead of rendering its own.
- `required` is only reported through `useCheckboxContext`; the primitive does not enforce it.
