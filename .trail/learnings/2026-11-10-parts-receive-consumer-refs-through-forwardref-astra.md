---
title: "Parts receive consumer refs through forwardRef plus the passthrough helper, not a new runtime wrapper"
author: Astra-void
date: 2026-11-10
branch: main
cost: { minutes: 16, tokens: 283205 }
id: l-ee4b5318
scope: repo
status: active
src: agent
touches:
  - packages/react/runtime/src/props.ts
  - tests/vitest/menu/ref-forwarding.test.tsx
  - tests/vitest/core/state-context-hooks.test.tsx
---

## Decided
Every lattice part that renders an instance is a `React.forwardRef` component, and the forwarded ref goes back into `getPassthroughProps` as its third argument, which restores it as `passthrough.ref`. Parts already compose `passthrough.ref` with their internal refs, so this one change reached ~77 parts with a mechanical edit. @rbxts/react 17 strips `ref` from props before a plain function component sees it, so without forwardRef `passthrough.ref` is always empty.

## Tried and ruled out
A new runtime helper (e.g. a `forwardPart(...)` wrapper exported from @lattice-ui/react-runtime). About 43 vitest files `vi.mock("@lattice-ui/react-runtime")` with a hand-picked export list, so any new runtime export used by parts breaks them all. Extending an existing function (`getPassthroughProps`) that mocks re-export from the real module avoids that.

## Watch out
- A part that sets its own `ref={...}` after `{...passthrough}` must compose `passthrough.ref`, not replace it (Menu/ContextMenu/Tooltip content did this; memoize the composed ref).
- `pnpm run lint:fix` rewrites `!== null` to `!== undefined` in package code. React 19 in vitest passes `null` for a missing forwarded ref, so check refs by truthiness.
- Under `asChild`, SwitchThumb puts passthrough (and the consumer ref) on its internal wrapper frame, not the slotted child.

In the code: packages/react/runtime/src/props.ts (`getPassthroughProps`), tests/vitest/menu/ref-forwarding.test.tsx.
