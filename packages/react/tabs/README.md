# @lattice-ui/react-tabs

Behavior-only Tabs primitives for Roblox UI, aligned with the lattice compound pattern.

## Exports

- `Tabs`
- `Tabs.Root`
- `Tabs.List`
- `Tabs.Trigger`
- `Tabs.Content`
- `useTabsTriggerContext`

## Notes

- `orientation` supports `horizontal` and `vertical` trigger navigation.
- Enabled triggers are selectable and activate immediately when the user moves focus onto them
  (arrows, D-pad, Tab). Programmatic focus, such as a `Dialog` seeding focus on its first trigger,
  does not change the selected tab.
- `useTabsTriggerContext()` inside a `Tabs.Trigger` returns `{ value, selected, disabled }`, so a
  trigger can style its selected state, also with an uncontrolled `defaultValue`.
