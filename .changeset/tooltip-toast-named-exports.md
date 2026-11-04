---
"@lattice-ui/react-tooltip": minor
"@lattice-ui/react-toast": minor
---

`@lattice-ui/react-tooltip` and `@lattice-ui/react-toast` export each part by name next to the namespace object, like the Dialog, Popover, Menu and ContextMenu entrypoints: `TooltipProvider`, `TooltipRoot`, `TooltipTrigger`, `TooltipPortal`, `TooltipContent`, and `ToastProvider`, `ToastViewport`, `ToastRoot`, `ToastTitle`, `ToastDescription`, `ToastAction`, `ToastClose`. The namespaces are type-checked against those parts with `satisfies`. Toast also exports the remaining queue helpers, `clearToasts`, `finalizeToast` and `TOAST_EXIT_TIMEOUT_MS`.
