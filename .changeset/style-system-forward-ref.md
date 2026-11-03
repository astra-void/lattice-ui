---
"@lattice-ui/react-style": patch
"@lattice-ui/react-system": patch
---

`Box`, `Text`, `Stack`, `Row`, `Grid` and `Surface` forward `ref` to the instance they render. As plain function components they lost it: React strips `ref` from props, and their prop types accepted it without complaint, so `<Stack ref={anchorRef}>` left the ref empty and these could not serve as popper anchors, focus targets or be measured. `Grid` composes the forwarded ref with the one it uses for its own layout.
