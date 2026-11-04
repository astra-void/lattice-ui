---
"@lattice-ui/react-scroll-area": patch
---

`ScrollArea.Thumb` sizes and positions itself against its track's measured length (the thumb parent's `AbsoluteSize`, kept up to date as it changes) instead of the viewport length. When the 18px minimum thumb applied and the scrollbar was shorter than the viewport (for example inset beside a `Corner`), the drawn thumb disagreed with the drag and track-click math. A track shorter than the minimum now caps the thumb at the track instead of erroring in `math.clamp`.
