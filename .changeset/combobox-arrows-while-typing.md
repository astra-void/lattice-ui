---
"@lattice-ui/react-combobox": patch
---

Up/Down in `Combobox.Input` move the highlight while you type. A focused TextBox receives no `InputBegan` events of its own, so the arrow handling added for keyboard selection never ran in Roblox. The input now reads Up/Down from `UserInputService` while it is being edited, and focus stays in the field.
