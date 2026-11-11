# @lattice-ui/react-layer

Layering, portal and presence primitives for Lattice UI overlays.

## Exports

- `DismissableLayer`
- `Portal`
- `PortalProvider` / `usePortalContext`
- `Presence`
- `LayerInteractEvent`, `DismissableLayerProps` (types)

## Notes

- `PortalProvider` sets the `container` (a `BasePlayerGui`) and `displayOrderBase` (default
  `1000`) for its subtree. `Portal` renders into its own `container` prop, else the provider's;
  with neither it throws.
- `DismissableLayer` portals its children into a full-screen `ScreenGui` whose `DisplayOrder` is
  `displayOrderBase` plus its stack order. A layer moves to the top of the stack each time it is
  enabled, so z-order and dismissal follow open order.
- Only the top-most enabled layer reacts. A pointer press outside `contentBoundaryRef` (and
  outside any `insideRefs`) calls `onPointerDownOutside`, `onInteractOutside`, then `onDismiss`.
- The dismiss key is gamepad `ButtonB` or keyboard `Backspace` (Roblox reserves Escape); it calls
  `onEscapeKeyDown`, then `onDismiss`, and is ignored while a `TextBox` has focus. The binding
  exists only while a layer is registered.
- Calling `event.preventDefault()` in any of those callbacks keeps the layer open.
- `modal` or `disableOutsidePointerEvents` adds a transparent, `Modal` blocker behind the content
  so outside presses do not reach the game or other UI.
- `Presence` keeps its `render` output mounted after `present` turns false until the render calls
  `onExitComplete`, or `exitFallbackMs` (default `1000`) elapses, so exit motion can finish.
