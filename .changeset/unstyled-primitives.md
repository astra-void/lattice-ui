---
"@lattice-ui/react-checkbox": minor
---

Make every primitive fully unstyled, and let consumers style them without `asChild`.

Primitives no longer bake in appearance. Colors, fixed sizes, font sizes, literal text content and
decorative `UICorner`/`UIStroke`/`UIPadding` children are gone from all 21 primitives. What they set
now is behavior, plus the minimum needed to neutralize Roblox instance defaults
(`BackgroundTransparency: 1`, `BorderSizePixel: 0`, `Text: ""`, `AutoButtonColor: false`) — because
unlike the DOM, a bare `textbutton` in Roblox is not invisible, it is an opaque grey box reading
"Button".

State-derived geometry stays owned by the primitive: progress fill ratios, slider thumb travel,
popper-driven content position, scroll thumb size, presence-driven `Visible`.

To make unstyled primitives usable, every part now forwards unknown props to the instance it
renders, so styling no longer requires `asChild`. Consumer props override the neutral defaults but
never the behavior props, consumer `Event` handlers are composed with the primitive's rather than
replacing them, and consumer refs are composed with any ref the primitive needs.

Default motion recipes are removed, since they animated hardcoded colors and offsets. Presence
*timing* is unchanged — content still stays mounted until an exit transition finishes — but an
animation now only runs if you pass `transition`.

Highlight state that previously only drove built-in colors is now exposed instead of dropped:
`useMenuItemContext`, `useContextMenuItemContext`, `useSelectItemContext` and
`useComboboxItemContext` return `{ highlighted, disabled }`.

BREAKING CHANGES:

- `Switch.Root` no longer accepts `trackColorMode`, `trackOnColor`, `trackOffColor` or
  `disabledTrackColor`, and the `SwitchTrackColorMode` type is gone. Style the track yourself.
- `RadioGroup.Item` and `ToggleGroup.Item` no longer accept `transition` (it only fed the removed
  color animation).
- `Select.Item` and `Combobox.Item` no longer render `textValue` as their label. Supply the label as
  a child, the way Radix requires `Select.ItemText`. `textValue` still drives `Select.Value` and
  combobox filtering.
- `Toast.Viewport` renders its children instead of the toast queue markup it used to hardcode. Map
  over `useToast().visibleToasts` yourself — which is what the `asChild` path already required.
- `Switch.Thumb` no longer applies a default size or a 2px inset.
- Anything that relied on a primitive's built-in look now renders invisible until styled.
