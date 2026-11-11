# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.9.0] - 2026-11-11

This release closes out the 2026-11 audit. Every primitive can now be driven without a pointer: overlays close with the platform back key, triggers, close buttons, checkboxes, switches, combobox inputs and context menus are reachable and activatable from the keyboard and gamepad, and ordered navigation follows the layout rather than mount order. The headless contract is tightened too: the remaining presence recipes that hardcoded an appearance are gone, every part forwards a consumer `ref` to the instance it renders, and the state that removed visuals used to show is exposed through context hooks. The `lattice` CLI keeps every `@lattice-ui/*` package on one version and stops touching the project while it detects package managers.

Migration notes:

- The presence recipes are removed: `createSurfaceRevealRecipe`, `createCanvasGroupRevealRecipe`, `createToastRevealRecipe`, `createOverlayFadeRecipe`, `createPopperEntranceRecipe`, `createCanvasGroupPopperEntranceRecipe` and `createIndicatorRevealRecipe`. If you passed one as a `transition`, write that `PresenceMotionConfig` in your app; `motionDuration`, `motionExitDuration`, `motionOffset` and `createPlacementOffset` stay exported for it.
- On `Box` and `Text`, direct props now win over `sx`, as they already did on `Stack`, `Row`, `Grid` and `Surface`. If you relied on `sx` overriding a direct prop, drop the direct prop or move the value into `sx`.
- `createRecipe` merges variant groups in ascending group-name order. When two groups set the same property, use a compound variant to choose the winner.
- Under `SystemProvider`, `useTheme().setTheme` writes the base theme and density is applied on top, so pass a base theme rather than a density-resolved one.
- `lattice upgrade` always moves every installed `@lattice-ui/*` package together and no longer offers a package selection. A confirmation with no terminal attached now fails with exit code 2 instead of answering "no"; pass `--yes` in scripts and CI.

### Added

- Every part that renders an instance forwards a consumer `ref` to it, so `<Menu.Content ref={contentRef}>`, `<Dialog.Trigger ref={anchorRef}>` and the rest can be measured, used as popper anchors or focused. `getPassthroughProps` takes the forwarded ref as an optional third argument. `Box`, `Text`, `Stack`, `Row`, `Grid` and `Surface` forward `ref` as well.
- State context hooks for primitives whose built-in visuals were removed: `useTabsTriggerContext` (`selected`), `useToggleGroupItemContext` (`pressed`), `useAccordionItemContext` (`open`), `useCheckboxContext` (`checked`, including `"indeterminate"`), `useProgressContext` (`value`, `max`, `ratio`, `indeterminate`), and `useTextFieldContext` / `useTextareaContext` with a new `focused` flag that lives on the Root.
- Overlays close with the platform back key: `ButtonB` on gamepad and `Backspace` on keyboard (ignored while a `TextBox` is focused) dismiss the top-most layer. Roblox reserves Escape, so it is not bound. Every `Content` part and `DismissableLayer` accept `onEscapeKeyDown`; call `event.preventDefault()` to keep the overlay open.
- `Combobox` can be driven without a pointer: Up/Down in the input move a highlighted item (the first press opens a closed list), Enter commits it, and `useComboboxItemContext().highlighted` reflects keyboard and pointer alike.
- `ContextMenu` works with keyboard, gamepad and touch: its content is an ordered, vertical focus scope like `Menu.Content`, and the trigger also opens on a touch long-press.
- `ToggleGroup.Root` takes an `orientation` prop, and arrow keys move focus between enabled items in layout order.
- `useLoopMotion` in `@lattice-ui/react-motion`, a continuous property loop driven by the motion scheduler that rests when motion is disabled or reduced. `Progress.Spinner` rotates through it.
- `useFocusNode`'s `onFocusChange` receives a `source` (`"navigation"` or `"programmatic"`), and `isNativeSelectionChange()` is exported for `SelectionGained` handlers on inline widgets.
- `@lattice-ui/react-runtime` exports `toCloneElementProps` and `flushSync`.
- `@lattice-ui/react-tooltip` and `@lattice-ui/react-toast` export each part by name next to the namespace object; Toast also exports `clearToasts`, `finalizeToast` and `TOAST_EXIT_TIMEOUT_MS`.
- READMEs for checkbox, context-menu, dialog, layer, menu, popover, radio-group, runtime, style, switch, system and tooltip, which shipped with empty npm pages.

### Changed

- While the navigation controller is bound it also turns off `GuiService.GuiNavigationEnabled`, restoring the previous value when it unbinds, so the engine's own arrow-key selection can no longer pull focus out of an open Select or Menu.
- Ordered navigation, Tab, and the arrow-key roving in `Tabs` and `RadioGroup` follow the layout (`LayoutOrder`, or `Name` under `SortOrder.Name`) instead of mount order.
- `Checkbox.Root`, `Switch.Root`, `Combobox.Input`, `Tooltip.Trigger`, `Dialog.Close`, `Popover.Close` and context-menu items register focus nodes; checkbox, switch, combobox, context-menu and tooltip now depend on `@lattice-ui/react-focus`.
- `Select.Content` traps focus while open and moves it onto the selected (or first enabled) item on open.
- `Tooltip.Trigger` opens from managed focus instead of the engine's `SelectionGained`/`SelectionLost`.
- `@lattice-ui/react-popper` no longer depends on `@lattice-ui/react-motion`.
- CLI: `lattice add` installs new packages at the version the project already uses and warns when installed packages disagree. `create` and `init` resolve versions from the configured registry (`npm_config_registry`, `.npmrc`, scoped registries and their tokens). With several package managers and no lockfile or pin, `--yes` takes the default instead of failing. Global `--verbose` and `--yes` / `-y` are accepted before the command name.

### Deprecated

- `Progress.Root`'s `onValueChange`. Progress is display-only and never called it.

### Removed

- The presence recipes listed in the migration notes.
- The unused legacy `FocusScope/focusManager.ts` and `FocusScope/scopeStack.ts` modules, which wrote `GuiService.SelectedObject` outside the focus bridge.

### Fixed

- `Dialog.Trigger` and `Popover.Trigger` activate with Enter/ButtonA, and `Dialog.Close` / `Popover.Close` are reachable from the keyboard and gamepad.
- Opening a trapped scope no longer changes a `RadioGroup` or `Tabs` value; items select on focus only when the user's navigation moved it.
- Cross-axis moves in an `"ordered"` scope escape to the parent scope instead of landing diagonally on a sibling.
- The navigation controller no longer swallows the left thumbstick while nothing in the UI is focused, and a cancelled stick input stops auto-repeat.
- `Menu` moves focus to its first item once per open instead of on every item mount or unmount.
- `Event` and `Change` handlers passed to a `Content` part with `asChild` connect instead of reaching the instance unconverted.
- Clicks just above or below an open layer dismiss it again; the outside-press test no longer counted a GUI-inset-tall band as inside.
- `Portal` with an explicit `container` renders without a `PortalProvider`.
- `usePresenceMotion` no longer restarts a reveal when re-rendered with a fresh config object, and reopening during an exit reverses from the current values.
- A controlled `TextField` or `Textarea` keeps showing its value when the consumer rejects or rewrites an edit.
- `Select.Value` shows the selected item's `textValue` while the popup is closed.
- `Combobox.Input` respects a consumer `PlaceholderText`, and Up/Down move the highlight while typing.
- `ScrollArea` with `type="always"` shows its scrollbars without overflow, and the thumb is sized against its measured track.
- `Slider` values snapped to a fractional `step` no longer carry floating-point noise.
- `Avatar.Image` works with an `imagebutton` under `asChild`, and `delayMs` applies when `src` is only on `Avatar.Image`.
- `Progress.Indicator` uses the context's indeterminate ratio, and a fractional `max` is no longer floored to 1.
- `Tabs.Content` names its default frame `TabsContent:<value>`, as the `asChild` path already did.
- `useTheme().setTheme` works inside a `SystemProvider` tree.
- `createRecipe` results no longer depend on Luau table iteration order.
- CLI: package-manager detection probes from the temp directory instead of the project and finds a workspace's shared lockfile; the package-manager pin is written only after confirmation; Ctrl+C at a text or y/N prompt exits 130 quietly; the generated `.gitignore` is created by `create` and `init`; Windows command lines are quoted correctly and project links use real `file://` URLs.

## [0.8.1] - 2026-08-10

### Fixed

- `asChild` accepts UI modifier siblings under both renderers. The modifier table held one spelling of each class at a time, and which one an element carries depends on who rendered it: `@rbxts/react` rewrites a host tag to its Roblox class name before building the element, so `<uicorner />` arrives as `"UICorner"`, while a browser React renderer leaves the tag as written. Keyed by tag, `asChild` failed on every styled subtree in Roblox; re-keyed by class name in 0.8.0, it failed the same way in a browser preview. Both spellings are now listed.
- `UIShadow` counts as a UI modifier. It is a creatable `UIComponent` that a Tailwind-style transform emits for `shadow-*`, and it was missing under either spelling, so it failed `asChild` exactly like a casing miss.
- Re-parenting UI modifiers no longer collides their keys with the cloned element's own children. Both child walks numbered from `.0`, and React may resolve a duplicate key by dropping a child rather than by warning.

## [0.8.0] - 2026-08-04

Every motion host that was a `CanvasGroup` renders as a `Frame`, so no primitive flattens its content into an offscreen composited layer behind your back. A `CanvasGroup` is right for exactly one effect — fading a whole subtree as a unit through `GroupTransparency` — and wrong for everything else: children could not carry their own transparency, and every dialog, menu and tooltip paid for the layer whether or not it faded. The composite is now opt-in, which is why `Dialog.Content` also gains `asChild`. Placement, presence timing, exit-before-unmount, dismissal boundaries, focus scoping and layering are untouched.

Migration notes:

- `GroupTransparency` and `GroupColor3` no longer compile on `Dialog.Content`, `Popover.Content`, `Tooltip.Content`, `Menu.Content`, `ContextMenu.Content`, `Select.Content`, `Combobox.Content` or `Toast.Root`. They were the only reason to know the host was a `CanvasGroup`.
- Swap `createCanvasGroupRevealRecipe()` for `createSurfaceRevealRecipe()` and `createCanvasGroupPopperEntranceRecipe(placement)` for `createPopperEntranceRecipe(placement)`. Both canvas-group recipes stay exported for a `canvasgroup` you slot in yourself.
- `BackgroundTransparency` fades one instance's own background, not its children, so labels and icons inside a fading surface stay opaque. Fade them alongside it, or bring the composited layer back deliberately through `asChild`.
- `Dialog.Content` is the one part with no drop-in replacement for a whole-surface fade: its host spans the layer, so `BackgroundTransparency` there paints the screen. Give the content a `Position`-only config and put the fade on the overlay dim, or pass `asChild` with your own `canvasgroup`.

### Added

- `Dialog.Content` accepts `asChild`. It was the last content part without it, and the only one with no way to fade its surface as a whole. Passing your own `canvasgroup` makes it the motion host, so `createCanvasGroupRevealRecipe()` fades the subtree as one composited layer again — opt-in rather than paid for by every dialog. The outside-press boundary moves one level down to match: the first host child of your element, which is the same panel a plain dialog renders directly under `Content`. Using the element itself would swallow every outside press, since it spans the layer. The dialog still owns `Size` and `Visible` on whatever element it renders.

### Changed

- **Breaking:** every remaining motion host renders a `Frame` instead of a `CanvasGroup`. `Dialog.Content`, `Popover.Content`, `Tooltip.Content`, `Menu.Content`, `ContextMenu.Content`, `Select.Content`, `Combobox.Content` and `Toast.Root` forward props onto a `Frame`, and forwarded props are type-checked against the instance the part renders, so the `CanvasGroup`-only props are compile errors there. A `transition` that faded a host through `GroupTransparency` has to animate `BackgroundTransparency` instead.
- Content subtrees are no longer flattened into a single composited layer, so children carry their own transparency rather than inheriting the host's.
- `createToastRevealRecipe` fades `BackgroundTransparency` so it still drives the now `Frame`-hosted `Toast.Root`.

### Fixed

- `asChild` works in Roblox on a subtree a Tailwind-style transform has styled. `Slot` decided which child to clone by looking each element's type up in a table of UI modifier tags keyed by the JSX tag — `uicorner`, `uilistlayout` — but `@rbxts/react` rewrites a host tag to its Roblox class name before building the element, so `<uicorner />` arrives as `"UICorner"` and every modifier missed the lookup. Missing it meant counting as a second candidate target, so `Slot` refused the subtree with "expected exactly one child element besides any UI modifiers" whenever more than one element was present. That is every styled `asChild` subtree in practice: a transform lowers `rounded-md` to a `UICorner` sibling and `flex-row` to a `UIListLayout`, so a component whose recipe sets either — which is most of them — could not use `asChild` at all. Class-to-prop lowering was never the problem; props reached the child correctly the whole time. Re-keying it by class name left the other spelling failing under a browser React renderer, which 0.8.1 finishes.
- `Slot` no longer reads `props.ref`. It is a `forwardRef` component, so a `ref` written on it always arrives as the forwarded ref argument — React strips `ref` out of `props` — which made the read dead code that only ever returned the development warning accessor. Reading it logged "`ref` is not a prop" on every render of an `asChild` primitive that composes a ref (`Dialog.Trigger`, `Slider.Track`, `Tabs.Trigger`, `ContextMenu.Trigger`, and friends). Ref composition itself is unchanged.

## [0.7.0] - 2026-07-20

This release strips every primitive down to behavior. Colors, sizes, fonts and decorative children are gone, any prop the underlying instance accepts now forwards through without `asChild`, and motion only runs when you ask for it. The CLI is rebuilt around the same idea: per-command help, keyboard-driven prompts, and a single connected run of output instead of five ceremonial sections.

Migration notes:

- Every primitive now renders unstyled. Pass the appearance props you want directly to the part — they forward onto the instance it renders — or use `asChild`. Forwarded props are type-checked against that instance, so a prop the element does not accept is a compile error.
- Motion no longer has defaults. Pass `transition` to any part that should animate; presence timing and exit-before-unmount are unchanged.
- Drop `trackColorMode`, `trackOnColor`, `trackOffColor` and `disabledTrackColor` from `Switch.Root`, and `transition` from `RadioGroup.Item` and `ToggleGroup.Item`.
- Supply labels as children on `Select.Item` and `Combobox.Item`; `textValue` no longer renders.
- Render the toast queue yourself inside `Toast.Viewport`, and supply the layout for `Menu.Group` and `ContextMenu.Group`.

### Added

- Give every CLI command its own help page. `lattice add --help`, `lattice help add` and `lattice add --bogus --help` all reach it, and the `add`, `remove` and `upgrade` pages list every available component and preset — previously the only way to see them was to start an interactive run.
- Suggest the closest match when a command, option, component or preset name is misspelled, and print actionable hints under errors instead of a bare message.
- Accept `-y` wherever `--yes` is accepted, and `-h` wherever `--help` is.
- Wire up `--verbose`. The flag was documented by the logger but never parsed, so `logger.debug` and the verbose file-copy logging could not be reached.
- Honor `NO_COLOR` and `FORCE_COLOR` for colored output, with `NO_COLOR` winning when both are set. Color previously keyed off TTY detection alone.
- Drive CLI selection prompts from the keyboard: arrow keys move, space toggles, `a`/`n` select all or none, enter confirms. They previously took a comma-separated list of numbers, and an unparseable answer aborted the whole command instead of re-asking.
- Make project paths and package names clickable through OSC 8 hyperlinks, shorten paths against the working directory and `~`, and report how long a command took. `NO_HYPERLINK` and `FORCE_HYPERLINK` control the links; they are off automatically under `CI`.
- Buffer the package manager's own output while a progress spinner is running and surface it only when the command fails. Inherited output used to interleave with the animation, scattering spinner frames through the install log. Pass `--verbose` to stream it live.
- Document styling in the README: the three ways to style a part, and a reference for the props a primitive owns and therefore ignores when you pass them — `Active`/`Selectable` from `disabled`, `Visible` from presence, `Text` from a controlled value, and the computed geometry on `Content`, `Indicator`, `Range`, `Thumb` and `Viewport` parts. Includes the `asChild` escape hatch for sizing a `Content` part.
- Expose the highlight state that used to only drive built-in colors: `useMenuItemContext`, `useContextMenuItemContext`, `useSelectItemContext` and `useComboboxItemContext` return `{ highlighted, disabled }`.
- Tell a focus node when managed focus enters or leaves it through `useFocusNode({ onFocusChange })`. A node can hold managed focus without ever becoming `GuiService.SelectedObject` — with `syncToRoblox: false`, or on an object that is not `Selectable` — and those widgets previously had no way to render a focus highlight, because `SelectionGained`/`SelectionLost` never fired for them. It also fires when the focused node unmounts, so a highlight cannot outlive its widget.
- Route activation to the focused node through `useFocusNode({ onActivate })`. While a `FocusScope` is active the navigation controller binds `Return`, `KeypadEnter`, `Space` and `ButtonA` at the navigation priority and runs the focused node's activation, rather than letting the engine activate whatever it has selected. A node that opts out is unaffected: the key passes through to the engine's own `Activated` as before. `activateFocusedNode()` is exported for driving the same path directly.

### Changed

- **Breaking:** make every primitive fully unstyled. Colors, fixed sizes, font sizes, literal text and decorative corner/stroke/padding children are gone; primitives now set behavior plus the minimum needed to neutralize Roblox instance defaults. Geometry computed from state — progress fill ratios, slider thumb travel, popper-driven position, scroll thumb size — stays owned by the primitive.
- Forward unknown props from every part onto the instance it renders, so styling no longer requires `asChild`. Consumer props override the neutral defaults but never the behavior props, consumer event handlers compose with the primitive's instead of replacing them, and consumer refs compose with the primitive's own.
- **Breaking:** check forwarded props against the instance each part renders. Passing a prop that element does not accept is now a compile error instead of being silently absorbed.
- **Breaking:** ship no default motion. Presence timing is unchanged and content still stays mounted until an exit transition finishes, but an animation only runs when you pass `transition`.
- Derive switch thumb travel from `AnchorPoint` and `Position` together, so it no longer depends on a declared `Size`. A thumb sized through a child element, a size constraint, or a layout previously parked itself off the right edge of the track.
- Validate CLI component and preset names before resolving a package manager. `lattice add dialogg` reported an unrelated package-manager error first whenever more than one manager was installed.
- Resolve a navigation keypress in a single pass over the focus registry, memoizing GUI ancestry, effective visibility and scope ownership for the duration of that pass and collecting candidates once per move instead of once per scope in the chain. The result is unchanged; the cost stops scaling quadratically with the number of registered focus nodes.
- Redraw CLI output as one connected run: a vertical gutter threads the header, each titled block and the closing verdict together, with tree branches for the rows inside a block and the elapsed time on the last line. This replaces the five ceremonial sections every command used to print — `doctor` no longer states its warning count three times, counts live in the heading of the block they describe, and the `?` glyph is gone from informational lines, where it read as a question. Piped output keeps a flat ASCII layout so logs and CI transcripts stay readable. Commands also report which package manager they resolved and why.

### Removed

- **Breaking:** `Switch.Root` no longer accepts `trackColorMode`, `trackOnColor`, `trackOffColor` or `disabledTrackColor`, and the `SwitchTrackColorMode` type is gone. Style the track yourself.
- **Breaking:** `RadioGroup.Item` and `ToggleGroup.Item` no longer accept `transition`; it only fed the removed color animation.
- **Breaking:** `Select.Item` and `Combobox.Item` no longer render `textValue` as their label. Supply the label as a child. `textValue` still drives `Select.Value` and combobox filtering.
- **Breaking:** `Toast.Viewport` renders its children instead of the toast queue markup it used to hardcode. Map over `useToast().visibleToasts` yourself, as the `asChild` path already required.
- **Breaking:** `Menu.Group` and `ContextMenu.Group` no longer render a vertical `UIListLayout` or force `AutomaticSize`. They were the last primitives holding an opinion about how their children lay out; supply the layout yourself, as `Select.Group` and `Combobox.Group` already required.

### Fixed

- Stop `Menu.Trigger` running its activation twice. A single keyboard or gamepad press made the engine fire both `Activated` and `InputBegan`, so `setOpen` toggled twice and the menu read as inert. Both parts now take activation from the focus manager instead of sniffing key codes in their own `InputBegan` handler, which also frees `InputBegan` on `Menu.Trigger` and `Menu.Item` for consumer use. `Menu.Item` fires `onSelect` exactly once per activation.
- Keep a menu item highlighted while it holds keyboard focus. Hover and focus fed one shared flag, so moving the pointer away cleared the highlight on the item the keyboard had focused, and an item that never became the engine's `SelectedObject` never highlighted at all. `useMenuItemContext().highlighted` now reports hover or managed focus, and its shape is unchanged.
- Center the switch thumb in its track. The thumb anchored at the track's top edge, so any thumb shorter than its track hung off the top with the leftover height pooling underneath — and no consumer could correct it, because motion owns the thumb's `AnchorPoint` and `Position`. Only the X edge changes with state now.
- Accept Roblox UI modifiers as siblings of an `asChild` element. `asChild` previously required the subtree to hold exactly one element, so a `UICorner`, `UIPadding` or `UIListLayout` written next to the child — the shape a Tailwind-style `className` transform emits when it lowers `rounded-*`, `p-*` or `gap-*` at the call site — either raised "asChild requires a child element" or cloned the modifier instead of the consumer's element. The modifier is now re-parented under the element the props land on. Fragments are looked through, and two real candidates remain an error.
- Render `children` from the 16 leaf parts that previously dropped them unless `asChild` was set — both separators, both text inputs, the labels, descriptions and messages on `TextField` and `Textarea`, `Toast.Title`, `Toast.Description`, `Select.Value`, `Combobox.Value`, `Avatar.Image` and `Dialog.Overlay`. Attaching a `UICorner`, `UIPadding` or any other child to one of these silently did nothing.
- Register the context-menu and motion packages in the CLI registry so `lattice add context-menu` and `lattice add motion` no longer fail with "Unknown component".
- Hand the terminal back when a selection prompt is cancelled. Ctrl-C left the cursor hidden and the terminal in raw mode, because the signal exited before the restore could run.
- Stop reporting a `--dry-run` as if it had run. `lattice add --dry-run` closed with "Added components: ..." and "Installed packages: 4" despite changing nothing; `remove` and `upgrade` did the same. Dry runs now say what they would do.
- Map `@lattice-ui/react-context-menu` in the tsconfig paths that were missing it. Typecheck fell back to resolving the package's build output, which exists locally but not on a clean checkout.

## [0.6.2] - 2026-07-19

This patch repairs CLI scaffolding on npm, where a peer conflict is a hard error, and pins the package manager a project was generated with.

Migration notes:

- Projects scaffolded before this release may still list pre-0.6.1 package names alongside their renamed replacements; run `init` to rewrite them, or `doctor` to see what needs attention.
- TypeScript is now pinned to the version roblox-ts compiles with; `doctor` warns if your project is already on an unsupported major.

### Added

- Pin the resolved package manager in scaffolded projects through the `devEngines` field, so a project generated with one package manager cannot be silently installed with another; `add`, `remove`, and `upgrade` apply the pin before touching dependencies.

### Fixed

- Fix `init` failing outright on npm by pinning TypeScript to a version roblox-ts supports instead of resolving the latest dist-tag.
- Rewrite pre-0.6.1 package names left in existing manifests during `init` instead of resolving them alongside their replacements; `doctor` now reports them and `upgrade` skips them.
- Roll back file changes when `init` or `create` fails, so a failed install no longer leaves a half-written scaffold for the next run to merge on top of.
- Point local command hints at the `lattice-ui` binary, since `npx lattice` does not resolve for npm projects.
- Skip lib checks in the scaffolded `tsconfig` so `typecheck` passes on a freshly scaffolded project.

## [0.6.1] - 2026-07-19

This release moves every package under a framework layer directory so future Vide and plain-Luau targets can sit beside React. It is a rename only: no runtime behavior, exports, or APIs changed.

Migration notes:

- Add the `react-` prefix to every `@lattice-ui/*` import: `@lattice-ui/<name>` is now `@lattice-ui/react-<name>` (for example `@lattice-ui/checkbox` becomes `@lattice-ui/react-checkbox`).
- Replace `@lattice-ui/core` with `@lattice-ui/react-runtime`.
- Update dependency entries in `package.json` to the new published names before upgrading.
- If you pin CLI registry keys, rename the `core` key to `runtime`; all other component keys are unchanged.

### Changed

- **Breaking:** packages now publish as `@lattice-ui/<layer>-<name>` from `packages/<layer>/<name>`, so `@lattice-ui/<name>` becomes `@lattice-ui/react-<name>` and `@lattice-ui/core` becomes `@lattice-ui/react-runtime`.
- **Breaking:** the CLI registry key `core` is now `runtime`; other component keys are unchanged.

## [0.6.0] - 2026-07-19

This release replaces Roblox's native GUI selection navigation with a focus controller Lattice owns, rebuilds the toast lifecycle on presence motion, adds a pointer-anchored context menu, and unifies default motion behind shared tokens.

Migration notes:

- Replace `retainExternalFocusBridge` and `releaseExternalFocusBridge` with `retainNavigation` and `releaseNavigation`; `GuiService.SelectedObject` is now render-only, so changing it externally no longer moves focus.
- Update `Toast.Root`'s `transition` prop from a `ResponseMotionConfig` to a `PresenceMotionConfig` (`initial`/`reveal`/`exit`).
- Review any per-component motion duration or offset overrides — defaults now come from shared motion tokens and several values changed to match.

### Added

- Add a `@lattice-ui/context-menu` package that opens a menu at the pointer, placing and flipping against the cursor instead of a trigger's bounds.
- Open the Combobox option list when the input gains focus, showing the full set until typing narrows it; disabled comboboxes still refuse to open.
- Add an opt-in `truncate` prop to `Text` that ellipsizes single-line overflow.
- Make Select triggers and items, toggle-group items, and accordion triggers gamepad-selectable so pad users can open, move between, and commit on overlay items.
- Add a focus activation guard so a single gamepad or keyboard activation is handled once instead of twice.
- Add a `getCapturesDirectional` focus-node hook so widgets that need an arrow key for themselves (text field and textarea cursors, slider value axis) can opt out per direction.
- Add a toast reveal presence recipe for enter/exit fades that matches the other overlay components.

### Changed

- **Breaking:** directional keyboard and gamepad navigation is now driven by a Lattice-owned controller with hybrid ordered/spatial resolution per focus scope, escaping up the scope chain until a trapped scope stops the walk.
- **Breaking:** `Toast.Root` now takes presence motion config, and toasts fade in, stay visible while their exit animation plays, and are removed only once it finishes.
- Start toast expiry timers when a toast enters the visible window instead of at enqueue time, so toasts queued behind `maxVisible` get their full display duration, and animate `clear()` through the exit transition.
- Source every presence and response motion recipe from shared duration, offset, settle, and drag tokens so timing and travel distance are consistent across components.
- Have Menu and Select declare ordered vertical focus scopes instead of hand-rolling up/down handling.
- Re-promote a dismissable layer to the top of the stack each time it opens so z-order and dismissal order follow open order.

### Removed

- **Breaking:** remove `retainExternalFocusBridge` and `releaseExternalFocusBridge` from `@lattice-ui/focus`, along with the reverse `GuiService.SelectedObject` listener.

### Fixed

- Dismiss layers on outside clicks when no content boundary ref is supplied, instead of treating every pointer position as inside.
- Stop clicking a Popover, Select, or Menu trigger from dismissing the layer it just opened, and stop dropping presses that Roblox marks as sunk by an active GUI element.
- Keep Popper collision math aligned with where content actually renders by resolving a `ScreenGui`'s viewport rect from the GUI inset.
- Fix Combobox filtering so a query actually narrows the option list instead of matching every option.
- Keep the selected Combobox label and the selected Select value after the popup content unmounts.
- Render the Dialog overlay by hosting it in its own `ScreenGui`, so dialog content sits above its dim.
- Preserve the X scale of full-width textareas during auto-resize instead of collapsing them to zero width.
- Re-report avatar loaded status for already-cached textures when the source changes, instead of leaving the avatar blank.
- Stop long animations from settling early on high-refresh clients by advancing motion state only on a successful property write.
- Keep `onChange` retries alive for controlled state, so a parent rejecting a change no longer silently swallows later ones.
- Fix `asChild` composition so a slotted host child keeps its own event handlers and its ref survives React's development warning sentinel.

## [0.5.1] - 2026-07-18

This patch corrects Combobox selection, filtering, and clear behavior so controlled values and reopened lists behave predictably.

Migration notes:

- `onValueChange` now receives `undefined` when the selection is cleared; handle that case if you assume a value is always present.

### Fixed

- Reset the Combobox filter query on close so reopening shows the full item list instead of only the previously selected item.
- Stop async item registration from clobbering a controlled Combobox value; a selection is now only forced when the selected item is registered but disabled.
- Allow clearing a Combobox selection by emptying the input before closing.
- Order registered Combobox items by layout order so the forced-selection fallback picks the visually first item, and refresh cached labels and disabled state when they change.

## [0.5.0] - 2026-04-07

This release extracts shared focus and motion helpers into dedicated packages, expands the CLI's project scaffolding, and standardizes motion behavior across layered primitives.

Migration notes:

- Update any imports that used focus or motion helpers from `@lattice-ui/core` to `@lattice-ui/focus` and `@lattice-ui/motion`.
- If you regenerate projects with the CLI, review the updated pnpm hoisting and theme provider setup before shipping the scaffold.

### Added

- Add a shared `@lattice-ui/motion` package for tween and presence helpers.
- Add a shared `@lattice-ui/focus` package for focus management helpers.
- Add an interactive `init` CLI command for existing projects with safe template merging and JSONC-aware config updates.
- Add scaffold support for `create` and `init` so generated projects can start from the maintained package templates.
- Add `default.project.json` support to package scaffolds so generated projects boot consistently.

### Changed

- Move shared focus and motion helpers out of `@lattice-ui/core` into dedicated package entrypoints.
- Adopt placement-relative Popper positioning options (`placement`, `sideOffset`, `alignOffset`, and `collisionPadding`).
- Expand `usePopper` positioning metadata to expose resolved placement/position state and measured content size (`position`, `anchorPoint`, `placement`, `contentSize`, `isPositioned`, and `update`).
- Update layered components to use the shared motion and focus packages for more consistent interaction and exit behavior.
- Refresh the CLI-generated project scaffold to handle pnpm hoisting and theme provider setup more reliably.
- Make transitions feel consistent across components by sharing the same motion recipes everywhere.
- Keep package metadata, scripts, and published entrypoints aligned with the new package split.

### Fixed

- Keep layered content mounted through motion transitions so exit animations complete instead of flashing or unmounting early.
- Improve Dialog bounds handling and Popper placement so overlays stay aligned when refs or viewport data change, including flip and clamp behavior near viewport edges.
- Keep overlay content visually centered by sizing the positioned wrapper from measured content size.
- Prevent Select and Combobox interaction regressions by restoring focus and avoiding first-frame content flashes.
- Normalize slider and switch thumb anchors, then smooth out the remaining motion timing in Tooltip, Tabs, Checkbox, Radio Group, Progress, Accordion, and Textarea.

## [0.4.4] - 2026-03-22

This patch completes the CLI package rename so generated files, docs, and workspace tooling consistently target the published `lattice-ui` package.

Migration notes:

- Replace any remaining `@lattice-ui/cli` install or script references with `lattice-ui`.

### Fixed

- Update the CLI docs, generated templates, and command output to use the published `lattice-ui` package name consistently.
- Fix workspace tooling classification so the renamed `lattice-ui` package is handled correctly by workspace policy checks.

## [0.4.3] - 2026-03-22

This release renames the published CLI package to `lattice-ui` so installation and upgrade flows match the supported package name.

Migration notes:

- Replace `@lattice-ui/cli` with `lattice-ui` in install commands, scripts, and automation before upgrading.

### Changed

- Rename the published CLI package from `@lattice-ui/cli` to `lattice-ui`.

## [0.4.2] - 2026-03-22

### Added

- Add automatic package manager detection across CLI commands so `create`, `init`, and related flows adapt to the project's existing npm, pnpm, or yarn setup.

## [0.4.1] - 2026-03-22

### Fixed

- Fix CLI scaffolding for pnpm-based projects by wiring the generated setup for hoisting and the theme provider more reliably.

## [0.4.0] - 2026-03-20

This release narrows the workspace to the maintained UI package surface, adds shared focus-management primitives, and improves interaction reliability across layered and composite components.

Migration notes:

- If you depended on the preview, compiler, preview-runtime, preview-engine, or layout-engine workspace packages, upgrade to the maintained component packages and CLI entrypoints only.
- If you relied on `SwitchThumb` `forceMount` or the legacy roving-focus example flows, remove those assumptions before upgrading.

### Added

- Add a `create` command to the CLI for scaffolding workspace packages from the bundled templates.
- Add core focus manager primitives to coordinate focus registration, ordering, and restoration across interactive components.
- Add direct `ScrollArea` track-click and thumb-drag interactions for moving the viewport.

### Changed

- Rework layered and composite components to share the new focus manager across accordion, dialog, menu, popover, radio group, select, and tabs.
- Narrow the supported workflow to the maintained component packages and CLI entrypoints.
- Improve workspace reliability for repeated builds and incremental execution across the monorepo.

### Removed

- Drop the unsupported preview and layout tooling surface from this release.
- Remove deprecated `SwitchThumb` `forceMount` behavior and the legacy roving-focus example flows.

### Fixed

- Improve focus restoration, modal trapping, and layer coordination across Dialog, Menu, Popover, Select, Radio Group, and Tabs.
- Fix Select and Combobox interaction behavior by restoring trigger focus more reliably, disabling Roblox native text-selection interference, and keeping popup anchoring aligned with the input.
- Fix Tooltip trigger state handling so hover and focus activity cooperate correctly and disabled triggers close cleanly.
- Fix Textarea auto-resize sizing by measuring text bounds, line height, and vertical padding more accurately.
