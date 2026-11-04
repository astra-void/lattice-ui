---
title: Vitest passes code that Luau runs differently
author: Astra-void
date: 2026-11-04
branch: main
cost: { minutes: 1, tokens: 0 }
id: l-7f67ca0d
scope: repo
status: active
src: agent
touches:
  - tests/vitest/setup/roblox-shim.ts
  - packages/react/style/src/recipe/createRecipe.ts
  - packages/react/motion/src/runtime/spec.ts
---

## Decided
Unit tests run TypeScript in Node, not Luau, so three Luau behaviours never show up in vitest and have to be handled by how the code is written, not caught by a test:

- `pairs` over a string-keyed table has no defined order in Luau, while JS keeps insertion order. Anything that merges by iterating keys (recipe variant groups) must sort the keys or use an explicit list; a test can only check that path, it cannot reproduce the Luau order.
- Luau `table.sort` takes a boolean `a < b` comparator; JS `Array.sort` wants a number, and silently mis-sorts with a boolean. The shim now converts boolean comparators so focus tree-order sorts behave as in Roblox.
- `repeat` is a reserved Luau keyword. roblox-ts compiles a `repeat` object key to `["repeat"]` (verified by building react-motion), but a parameter or local named `repeat` is rejected by lint, so name those `repeatMode`.

## Watch out
- The vitest `Enum.KeyCode` shim only defines Return, Space and Escape. Tests that press other keys add them in `beforeEach` (see the slider and toggle-group tests).
- Passing tests are not Roblox runtime proof; compile with `npx rbxtsc` in the package and run the harness when Luau semantics matter.

In the code: `tests/vitest/setup/roblox-shim.ts` (sort comparator conversion, Enum shim), `packages/react/style/src/recipe/createRecipe.ts` (sorted variant groups), `packages/react/motion/src/runtime/spec.ts` (`resolveLoopDriver`, `repeatMode`).
