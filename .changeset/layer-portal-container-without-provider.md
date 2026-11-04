---
"@lattice-ui/react-layer": patch
---

`Portal` with an explicit `container` renders without a `PortalProvider`. It used to read the provider context strictly before looking at `container`, so it always threw outside a provider. With neither a `container` nor a provider it still throws the same context error.
