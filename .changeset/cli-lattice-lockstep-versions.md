---
"lattice-ui": patch
---

`lattice add` installs new `@lattice-ui/*` packages at the version the project already uses (from `node_modules`, or the manifest before the first install) instead of `latest`, and warns when the installed packages are already on different versions. `lattice upgrade` now always moves every installed `@lattice-ui/*` package together: the package selection prompt is gone, and naming components only checks that one of them is installed. Mixing versions nested duplicate copies of the shared packages, each with its own React contexts.
