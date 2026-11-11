# @lattice-ui/react-accordion

Headless accordion primitives for Roblox UI with single and multiple disclosure modes.

## Exports

- `Accordion`
- `Accordion.Root`
- `Accordion.Item`
- `Accordion.Header`
- `Accordion.Trigger`
- `Accordion.Content`
- `useAccordionItemContext`

## Notes

- Supports `type="single" | "multiple"`.
- Supports controlled/uncontrolled `value`.
- `useAccordionItemContext()` inside an `Accordion.Item` returns `{ value, open, disabled }`, for
  styling open state (a chevron, say) without mirroring `onValueChange`.
