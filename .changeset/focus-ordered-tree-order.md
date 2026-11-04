---
"@lattice-ui/react-focus": patch
"@lattice-ui/react-tabs": patch
"@lattice-ui/react-radio-group": patch
---

Ordered navigation follows the layout instead of mount order. Ordered `FocusScope`s, Tab, and the arrow-key roving in `Tabs` and `RadioGroup` used to step through items in the order they first mounted, so an item shown conditionally, inserted in the middle, or remounted by a key change sorted to the end. Items now sort the way a `UIListLayout` / `UIGridLayout` shows them: by sibling `LayoutOrder` (or `Name` under a layout with `SortOrder.Name`), with mount order breaking ties. `Tabs.Trigger` and `RadioGroup.Item` also no longer unregister and re-register on every value change.
