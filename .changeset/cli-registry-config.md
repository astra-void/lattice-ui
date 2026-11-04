---
"lattice-ui": patch
---

`lattice create` and `lattice init` resolve latest versions from the registry the project is configured for instead of always calling registry.npmjs.org. The lookup honours `npm_config_registry`, project and parent `.npmrc` files and `~/.npmrc`, including scoped `@scope:registry` entries and their `_authToken`, so mirrors and private registries work. A failed lookup now names the URL it requested, and hints at `NODE_USE_ENV_PROXY=1` when `HTTPS_PROXY` is set.
