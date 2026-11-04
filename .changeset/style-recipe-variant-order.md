---
"@lattice-ui/react-style": patch
---

`createRecipe` merges variant groups in sorted group-name order, so the result no longer depends on table iteration order. It used to walk the groups with `pairs`, which has no defined order for string keys in Luau, so when two groups set the same property (say `size` and `density` both set `TextSize`) either one could win. The full order is now `base`, then each selected group by ascending name, then matching `compoundVariants` in array order. Use a compound variant to pick a different winner for a specific combination.
