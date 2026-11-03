---
"@lattice-ui/react-layer": patch
---

Clicks just above or below an open layer dismiss it again. The outside-press test also hit-tested points shifted by the GUI inset, so a band as tall as the top bar (36–58px) above and below every layer's content counted as inside. `InputObject.Position` and `GetGuiObjectsAtPosition` share one coordinate frame, so the pointer is now tested only where it is.
