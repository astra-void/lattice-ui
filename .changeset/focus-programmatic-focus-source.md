---
"@lattice-ui/react-focus": minor
"@lattice-ui/react-tabs": patch
"@lattice-ui/react-radio-group": patch
---

Opening a trapped scope no longer changes a `RadioGroup` or `Tabs` value. A `Dialog` whose first focusable content was `RadioGroup` with `defaultValue="b"` opened with "a" selected and fired `onValueChange("a")`, because the trap's fallback focus was treated like the user choosing the item. Items now select on focus only when the user's navigation moved it.

`useFocusNode`'s `onFocusChange` receives a second argument, `source`: `"navigation"` when the navigation controller moved focus for directional or Tab input, `"programmatic"` otherwise. `isNativeSelectionChange()` is exported for `SelectionGained` handlers on inline widgets: it is false while a `FocusScope` is active or while the focus bridge writes `SelectedObject`.
