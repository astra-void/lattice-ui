---
"@lattice-ui/react-focus": patch
---

Cross-axis moves in an `"ordered"` scope escape to the parent scope, as documented. The scope used to run a spatial search over its own nodes first, so in a vertical Menu or Select list with items of different widths, Right from a narrow item could land diagonally on a wider sibling instead of leaving the list. Once a move escapes a scope, that scope's nodes are also no longer candidates in the parent.
