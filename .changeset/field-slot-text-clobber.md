---
"@lattice-ui/text-field": patch
"@lattice-ui/textarea": patch
---

Label, Description, and Message no longer force their placeholder `Text` ("Label"/"Description"/"Message") onto the child element under `asChild`, so consumer-provided `Text` is preserved. The placeholder text still applies to the styled default (non-`asChild`) rendering.
