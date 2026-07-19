# @lattice-ui/focus

Focus management primitives for Roblox UI.

## Current status

- `FocusScope` traps and restores focus, and now drives a custom navigation
  controller instead of native Roblox GUI selection.

## Navigation

- Directional input is owned by a `ContextActionService`-based controller
  (keyboard arrows + Tab, gamepad D-pad + thumbstick with auto-repeat). It binds
  only while a `FocusScope` is active and disables `AutoSelectGuiEnabled`.
- `GuiService.SelectedObject` is a render-only mirror; external changes are not
  read back into focus state.
- Resolution is hybrid. A scope's `navStrategy` selects between:
  - `"ordered"`: step through nodes by registration order along
    `navOrientation`; cross-axis moves escape to the parent scope.
  - `"spatial"` (default): pick the nearest node in the pressed direction by
    geometry.
- Focus nodes can consume a direction themselves via `getCapturesDirectional`
  (e.g. text inputs move the text cursor while editing); the controller passes
  those inputs through instead of moving focus.

## FocusScope behavior

- `active` defaults to `true`.
- `asChild` keeps caller tree structure; without it, `FocusScope` renders a transparent full-size frame wrapper.
- When `trapped` is true, outside selections are redirected to:
  1. last focused selectable object inside the scope, then
  2. first selectable descendant inside the scope.
- Nested trapped scopes use stack order; only the top-most active trapped scope redirects focus.
- When `restoreFocus` is true, captured focus is restored on unmount/deactivation if the target is still valid.

## Known limits

- Spatial resolution compares element centres; it does not yet special-case
  overlapping or nested candidates.
