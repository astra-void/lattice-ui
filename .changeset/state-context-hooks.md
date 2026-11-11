---
"@lattice-ui/react-accordion": minor
"@lattice-ui/react-checkbox": minor
"@lattice-ui/react-tabs": minor
"@lattice-ui/react-text-field": minor
"@lattice-ui/react-textarea": minor
"@lattice-ui/react-toggle-group": minor
---

Primitives whose built-in visuals were removed now expose the state those visuals were driven by, so consumers can style it without mirroring `onValueChange` or tracking focus themselves, also in uncontrolled mode:

- `useTabsTriggerContext()` inside a `Tabs.Trigger`: `{ value, selected, disabled }`.
- `useToggleGroupItemContext()` inside a `ToggleGroup.Item`: `{ value, pressed, disabled }`.
- `useAccordionItemContext()` inside an `Accordion.Item`: `{ value, open, disabled }`.
- `useCheckboxContext()` inside a `Checkbox.Root`: `checked` (including `"indeterminate"`), `disabled`, `required`.
- `useTextFieldContext()` / `useTextareaContext()` under the Root: `value`, `invalid`, `required`, `disabled`, `readOnly`, and a new `focused` flag. Focus used to be local state in the Input; it now lives on the Root context, set by the Input.
