---
"@lattice-ui/react-checkbox": minor
---

Type forwarded props against the instance each part renders, and make switch thumb travel
independent of the thumb's width.

`PassthroughProps` was `Record<string, unknown>`, so a primitive accepted any prop at all: typos and
props that had been removed from the API compiled fine and failed at runtime. It is now
`PassthroughProps<T> = React.InstanceProps<T>`, parameterized by the instance the part actually
renders, so forwarded props are checked. `Slot` targets an element the consumer owns and whose type
the primitive cannot know, so `toSlotProps` marks that one legitimate widening point.

`Switch.Thumb` no longer needs a declared `Size`. It animates `AnchorPoint` and `Position` on a
single motion track — unchecked `(0,0)` / scale `(0,0)`, checked `(1,0)` / scale `(1,0)` — so travel
resolves to `t * (trackWidth - thumbWidth)` for any thumb width. Previously a thumb sized through a
child element, a `UISizeConstraint`, or a layout rather than a literal `Size` prop parked itself off
the right edge of the track. `Position` and `AnchorPoint` are now dropped from the thumb's forwarded
props, since motion owns them.
