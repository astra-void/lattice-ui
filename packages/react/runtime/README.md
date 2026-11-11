# @lattice-ui/react-runtime

Shared React runtime and composition helpers for Lattice UI packages.

## Exports

- `React`, `ReactRoblox`: the `@rbxts/react` and `@rbxts/react-roblox` modules every package uses
- `Slot`, `getSlotChild`, `resolveSlotChildren`, `mergeSlotModifiers`, `toCloneElementProps`
- `getPassthroughProps`, `toSlotProps`, `composeEvents`, `PassthroughProps` (type)
- `composeRefs`, `setRef`, `toRef`, `getElementRef`
- `useControllableState`
- `createStrictContext`
- `flushSync`

## Notes

- `Slot` implements `asChild`: it clones its single child with the primitive's props merged on
  top, composes `Event` / `Change` handlers instead of replacing them, and composes the child's
  `ref` with its own. UI modifiers written as siblings (`UICorner`, `UIStroke`, layouts, …) are
  re-attached under the child.
- `getPassthroughProps(props, ownKeys, forwardedRef?)` returns every prop except the part's own
  API, for spreading onto the rendered instance. `@rbxts/react` strips `ref` from props, so parts
  are `React.forwardRef` components and pass the forwarded ref as the third argument to restore it
  as `passthrough.ref`.
- `composeEvents` runs the consumer's handler first, then the primitive's.
- `useControllableState({ value, defaultValue, onChange })` returns `[state, setState]`. A
  controlled parent that rejects a change keeps its value, and a retry still calls `onChange`.
- `createStrictContext(name)` returns `[Provider, useContext]`; the hook errors outside its provider.
- `flushSync` commits React updates scheduled inside its callback before returning, falling back
  to a plain call when `@rbxts/react-roblox` does not provide it.
