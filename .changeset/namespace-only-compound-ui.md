---
"@lattice-ui/accordion": minor
"@lattice-ui/avatar": minor
"@lattice-ui/checkbox": minor
"@lattice-ui/combobox": minor
"@lattice-ui/dialog": minor
"@lattice-ui/menu": minor
"@lattice-ui/popover": minor
"@lattice-ui/progress": minor
"@lattice-ui/radio-group": minor
"@lattice-ui/scroll-area": minor
"@lattice-ui/select": minor
"@lattice-ui/slider": minor
"@lattice-ui/switch": minor
"@lattice-ui/tabs": minor
"@lattice-ui/text-field": minor
"@lattice-ui/textarea": minor
"@lattice-ui/toast": minor
"@lattice-ui/toggle-group": minor
"@lattice-ui/tooltip": minor
---

Migrate compound component packages to namespace-only APIs.

BREAKING CHANGE: Flat component exports were removed from these packages.

Use namespace access instead:

- `SelectRoot` / `SelectTrigger` -> `Select.Root` / `Select.Trigger`
- `Dialog` / `DialogContent` -> `Dialog.Root` / `Dialog.Content`
- `TooltipProvider` / `Tooltip` / `TooltipContent` -> `Tooltip.Provider` / `Tooltip.Root` / `Tooltip.Content`

Utility and hook exports remain named (for example `useToast`, queue helpers, and math helpers).
