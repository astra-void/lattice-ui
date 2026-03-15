# @lattice-ui/focus

Focus management primitives for Roblox UI.

## Current status

- `FocusScope` can trap `GuiService.SelectedObject` and restore captured focus on scope teardown.

## FocusScope behavior

- `active` defaults to `true`.
- `asChild` keeps caller tree structure; without it, `FocusScope` renders a transparent full-size frame wrapper.
- When `trapped` is true, outside selections are redirected to:
  1. last focused selectable object inside the scope, then
  2. first selectable descendant inside the scope.
- Nested trapped scopes use stack order; only the top-most active trapped scope redirects focus.
- When `restoreFocus` is true, captured focus is restored on unmount/deactivation if the target is still valid.

## Known limits

- Trap and restore currently use `GuiService.SelectedObject` only.
- This phase does not manage `NextSelection*` graph rewrites.
