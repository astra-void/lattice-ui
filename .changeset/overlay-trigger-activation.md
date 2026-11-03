---
"@lattice-ui/react-dialog": patch
"@lattice-ui/react-popover": patch
---

`Dialog.Trigger` and `Popover.Trigger` can be activated with keyboard and gamepad. Their focus node had no `onActivate` and was not mirrored to `GuiService.SelectedObject`, so focusing a trigger with the D-pad (or having focus restored to it after close) and pressing Enter/ButtonA did nothing. They now follow `Menu.Trigger`: activation comes through the focus node under an activation guard, and the trigger is `Selectable` unless disabled.
