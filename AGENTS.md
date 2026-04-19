# AGENTS.md

## Project overview

This repository is the Lattice UI monorepo.

It contains:

- publishable UI packages under `packages/*`
- app workspaces under `apps/*`
  - `apps/playground`: Roblox playground for manual UI verification
  - `apps/loom-preview`: typecheck-only preview integration workspace
  - `apps/test-harness`: Roblox TestEZ harness for package-level behavior checks

Primary goals of changes in this repository:

- preserve stable package boundaries
- keep package exports and package metadata consistent
- avoid regressions in interaction, focus, layer, motion, and overlay behavior
- make minimal, targeted changes instead of broad rewrites unless explicitly requested

## Repository rules

- Use `pnpm`.
- Respect the monorepo layout and existing workspace scripts.
- Respect lockedstep package versioning and workspace conventions.
- Do not introduce ad-hoc package structure changes unless the task is explicitly about package structure.
- Do not rename packages, move large folders, or redesign public APIs unless the task explicitly requires it.
- Prefer surgical fixes over architecture churn.
- Keep user-facing behavior changes aligned with the existing package intent and maturity level.

## Headless UI philosophy

Lattice UI is a headless-first UI toolkit.

Agent guidance for component design:

- Prefer behavior, composition, and state orchestration over opinionated visuals.
- Keep primitives unstyled or minimally styled unless the task explicitly targets a styled surface.
- Do not bake product-specific appearance decisions into shared primitives.
- Prefer composability and small wrappers over monolithic, highly opinionated components.
- Preserve or improve flexible composition patterns such as slotting / `asChild`-style usage where already supported.
- Avoid adding unnecessary container layers or visual wrappers just to make implementation easier.
- Shared packages should primarily own interaction logic, accessibility-like semantics, focus flow, layering, portal behavior, and controlled/uncontrolled state behavior.
- Playground scenes and consumer surfaces may demonstrate visuals, but they should not redefine package responsibilities.

When making changes:

- Fix behavior in the primitive when the bug belongs to the primitive.
- Avoid solving primitive problems only through playground styling or scene restructuring.
- Do not turn headless primitives into styled component bundles unless explicitly requested.

## Where to make changes

- Package source code lives in `packages/<name>/src`.
- Package public exports should be driven from each package's `src/index.ts`.
- Roblox playground scenes live in `apps/playground/src/client/scenes`.
- Loom preview targets live in `apps/loom-preview/src/preview-targets`.
- Roblox harness tests live in `apps/test-harness/src/tests`.
- Root workspace and release scripts live in the repository root `package.json` and `scripts/*`.

## Roblox environment notes

This repository targets Roblox UI development through TypeScript / roblox-ts workflows.

Agent guidance for Roblox-related work:

- Do not treat this repository like a browser-first React app.
- Do not assume DOM, CSS, or browser globals such as `window`, `document`, `HTMLElement`, or CSS layout behavior.
- Do not assume generic Node.js runtime APIs are available inside package runtime code unless the touched area is explicitly a Node-only script or CLI surface.
- Prefer existing Roblox GUI concepts and patterns used in the repository, such as `UDim2`, `Vector2`, `CanvasGroup`, `GuiObject`, `ScreenGui`, selection/focus behavior, and explicit instance props.

Environment-specific expectations:

- `apps/playground` is the primary manual Roblox verification surface.
- `apps/loom-preview` is a preview / approximation surface and should not be treated as the final source of truth for Roblox runtime correctness.
- `apps/test-harness` exists for Roblox-oriented tests. Agents must confirm `Roblox_Studio` MCP server connectivity before using any `test:rbx*` command for validation.
- If the `Roblox_Studio` MCP server is unavailable or unconfirmed, use static reasoning, code inspection, and non-Roblox validation commands instead of Roblox harness execution.
- Before running `test:rbx:headless` or `test:rbx:run`, close any existing Roblox Studio windows so `run-in-roblox` can open the generated place cleanly.

When working on Roblox-facing packages:

- Prefer fixes in the actual package source over scene-only patches.
- Be careful with focus, selection, layering, portals, presence, motion, and popper positioning because these are sensitive to Roblox GUI/runtime behavior.
- Do not claim runtime verification for Roblox behavior unless it was explicitly performed in an approved environment.
- If Roblox runtime behavior cannot be executed, describe conclusions as static reasoning, code inspection, or unverified inference.

Import and module safety:

- Follow existing workspace import conventions.
- Do not introduce direct runtime imports from arbitrary `node_modules` paths in package code.
- Prefer package entrypoints and repository-established patterns for shared code access.

## Motion guidance

This repository uses React for state and composition, but animation and motion behavior should flow through `@lattice-ui/motion`.

Agent guidance for motion-related changes:

- Use `@lattice-ui/motion` for animation, presence, feedback, and response motion in package and app components.
- Prefer existing motion recipes and hooks such as `usePresenceMotion`, `useResponseMotion`, and `useFeedbackEffect`.
- Do not add direct Roblox animation service usage, custom schedulers, per-frame interpolation, or render-loop animation logic in consuming packages.
- Use React state for semantic UI state such as open/closed, active/inactive, checked/unchecked, or present/absent.
- Do not mirror animation progress back into React state.

Practical expectations:

- `packages/motion` owns the motion runtime, scheduler, instance property interpolation, and motion policy behavior.
- Motion disabling or reduced-motion behavior should be handled through `@lattice-ui/motion` policy and APIs.
- If a primitive needs new motion behavior, extend `packages/motion` recipes, hooks, or public APIs instead of adding one-off animation logic in the primitive.
- Be especially careful with position, size, transparency, and color props that may be controlled by motion APIs.

## Change strategy

When fixing a bug:

1. Identify the narrowest package or app surface responsible.
2. Change the package first unless the problem is clearly scene-only or harness-only.
3. Avoid â€œfixingâ€ package bugs only in playground scenes unless the issue is truly local to the scene.
4. Preserve existing APIs unless the task explicitly allows API changes.
5. If behavior depends on focus, layer stacking, portals, presence, motion, or popper positioning, inspect neighboring packages before patching around the symptom.

When adding features:

1. Prefer existing primitives and patterns already used in nearby packages.
2. Keep exports, types, README notes, and tests in sync when public surface changes.
3. Do not add new dependencies unless necessary.

## Validation expectations

Current allowed validation commands:

- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run test:unit`

Do not use `test:rbx*` commands for routine task validation unless `Roblox_Studio` MCP server connectivity has been confirmed first.

Before running `test:rbx:headless` or `test:rbx:run`, close any existing Roblox Studio windows so `run-in-roblox` can open `apps/test-harness/test-harness.rbxlx` cleanly.

If `Roblox_Studio` MCP server connectivity is confirmed, the following root commands are also allowed:

- `pnpm run test:rbx`
- `pnpm run test:rbx:build`
- `pnpm run test:rbx:typecheck`
- `pnpm run test:rbx:prepare`
- `pnpm run test:rbx:place`
- `pnpm run test:rbx:headless`
- `pnpm run test:rbx:run`

Reason:

- the Roblox harness workflow is environment-dependent and requires confirmed MCP-backed Studio access
- agent task completion should not be blocked on Roblox harness availability when MCP access is unavailable
- confirmed MCP access provides an approved path for Roblox runtime validation when the task benefits from it

When reporting validation:

- explicitly report only the commands that were actually run
- claim Roblox runtime or harness verification only when MCP-backed Studio observation or headless execution was actually performed
- report `test:rbx:place` as preparation unless a runtime execution step also ran
- treat `test:rbx:headless` as the automated `run-in-roblox` validation path because it waits for harness status and returns failure through the CLI
- treat `test:rbx:run` as Studio-assisted because it opens the generated place and starts Play mode, but does not by itself prove test results unless MCP-backed Studio observation or another runtime result was captured

## Build and test commands

Common approved root commands:

- `pnpm run build`
- `pnpm run watch`
- `pnpm run typecheck`
- `pnpm run test`
- `pnpm run test:unit`
- `pnpm run lint`
- `pnpm run format:check`
- `pnpm run check`
- `pnpm run check:fast`

Additional approved root commands when `Roblox_Studio` MCP server connectivity has been confirmed:

- prep: `pnpm run test:rbx`, `pnpm run test:rbx:typecheck`, `pnpm run test:rbx:build`, `pnpm run test:rbx:prepare`, `pnpm run test:rbx:place`
- automated runtime: `pnpm run test:rbx:headless`
- Studio-assisted/manual handoff: `pnpm run test:rbx:run`

Prefer root workspace commands unless the task is explicitly package-local.

## Package conventions

For publishable packages under `packages/*`:

- preserve `main`, `types`, and `source` conventions
- preserve required files and standard scripts
- keep internal `@lattice-ui/*` dependencies on `workspace:*`
- do not hand-edit version drift across packages unless the task is release/versioning work

If creating a new package, follow the established workspace policy and package defaults rather than inventing a new layout.

## Editing guidance

- Keep code style aligned with the existing repository.
- Follow the current TypeScript / roblox-ts patterns already present in the touched package.
- Avoid unrelated cleanup in files outside the scope of the task.
- Avoid mass formatting changes unless requested.
- Do not replace targeted fixes with broad rewrites.
- Preserve comments and intentional structure when possible.

## For agent behavior

When reporting work:

- state what changed
- state why that package / file was the right place
- state what validation was run
- clearly distinguish â€œverifiedâ€ from â€œnot runâ€

When validation was not run:

- say so plainly
- do not imply runtime verification if only typecheck or static inspection was done

When a task spans multiple packages:

- explain the dependency chain
- keep each change minimal and justified

## Release and publish safety

This repository has release preparation and publish scripts.
Unless explicitly asked:

- do not run publish commands
- do not modify package versions
- do not generate or apply release/versioning changes
- do not alter release workflow assumptions

## Good defaults

If unsure:

- prefer root `typecheck` over package-local guessing
- prefer package fixes over playground-only patches
- prefer minimal diffs
- prefer adding or updating tests when behavior changes
- prefer explicit notes about environment limitations
