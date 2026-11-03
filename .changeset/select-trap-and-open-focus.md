---
"@lattice-ui/react-select": patch
---

`Select.Content` traps focus while open and moves focus into the list on open: onto the selected item when it can take focus, else onto the first enabled item, once per open. Before, focus stayed on the trigger, so a D-pad press after opening could resolve outside the list, and Left/Right from an item escaped to the surrounding UI while the popup stayed open. The back key or an outside press closes the list and restores focus to the trigger.
