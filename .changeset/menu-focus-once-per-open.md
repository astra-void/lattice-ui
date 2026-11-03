---
"@lattice-ui/react-menu": patch
---

`Menu` moves focus to its first item once per open. The effect used to re-run on every item registration, so items mounting or unmounting while the menu stayed open (a "Show more" item that calls `preventDefault`, async or filtered items) pulled focus back to the first item.
