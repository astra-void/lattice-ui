---
"@lattice-ui/react-focus": patch
---

While the navigation controller is bound, it also turns off `GuiService.GuiNavigationEnabled`, and restores the previous value when it unbinds. Roblox's own selection navigation moved `SelectedObject` on arrow keys even when the controller sank them. At a trap edge or on a cross-axis move in an ordered list, focus could jump out of an open Select or Menu onto an unrelated `ScrollingFrame`. The selection ring still renders and Enter/ButtonA still activates the focused object.
