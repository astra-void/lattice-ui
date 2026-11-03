---
"@lattice-ui/react-focus": patch
---

The navigation controller no longer swallows the left thumbstick while nothing in the UI is focused. Any active `FocusScope` binds the controller — a non-modal open popover is enough — and the stick used to be sunk unconditionally, so the player could not walk and moving the stick pulled focus into the UI. It now passes through like the D-pad does until focus is inside the UI, and a cancelled stick input (another binding taking `Thumbstick1`) stops auto-repeat instead of leaving focus drifting every 0.12s.
