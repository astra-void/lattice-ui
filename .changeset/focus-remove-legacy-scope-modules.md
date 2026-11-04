---
"@lattice-ui/react-focus": patch
---

Remove two unused legacy modules, `FocusScope/focusManager.ts` and `FocusScope/scopeStack.ts`, from the published source. Nothing imported them and they were not exported. They kept a second trapped-scope stack that disagreed with the focus manager and wrote `GuiService.SelectedObject` outside the focus bridge, so leaving them in invited accidental use.
