---
"@lattice-ui/react-layer": minor
"@lattice-ui/react-dialog": minor
"@lattice-ui/react-popover": minor
"@lattice-ui/react-menu": minor
"@lattice-ui/react-context-menu": minor
"@lattice-ui/react-select": minor
"@lattice-ui/react-combobox": minor
"@lattice-ui/react-tooltip": minor
---

Overlays close with the platform back key. While a layer is registered, `ButtonB` (gamepad) and `Backspace` (keyboard; ignored while a `TextBox` is focused) dismiss the top-most enabled layer and the press is sunk. Roblox reserves Escape for its own menu, so it is not bound. Every `Content` part (and `DismissableLayer`) accepts `onEscapeKeyDown`; call `event.preventDefault()` to keep the overlay open. Before this, a modal dialog could only be left with the pointer or a close button.
