# @lattice-ui/focus

This package is intentionally a skeleton in the current phase.

## Current status

- `FocusScope` and `RovingFocusGroup` are no-op placeholders.
- Public API is kept stable while layer/popper hardening lands first.

## Next implementation targets

- `FocusScope`: trap + restore behavior for dialog-like surfaces.
- `RovingFocusGroup`: keyboard/gamepad directional navigation.
- `GuiService.SelectedObject` + `NextSelection*` graph management.
- Focus restore flow to trigger elements when scope closes.
