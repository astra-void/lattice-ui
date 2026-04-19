# @lattice-ui/popper

Headless positioning utilities for Roblox UI overlays. The package computes placement-relative positions, exposes live positioning state through `usePopper`, and supports viewport-aware collision handling for anchored content.

## Current capabilities

- Supports `top | bottom | left | right` placement.
- Computes overlay position with placement-aware offsets and viewport collision handling.
- Provides `computePopper` and `usePopper` for one-off and reactive positioning flows.

## Positioning options

- `placement`: requested side relative to the anchor (`top`, `bottom`, `left`, or `right`).
- `sideOffset`: distance from the anchor along the primary placement axis.
- `alignOffset`: alignment shift along the cross axis for the chosen placement.
- `collisionPadding`: viewport inset used when clamping and evaluating placement overflow.

## usePopper result

`usePopper` returns resolved positioning metadata and lifecycle state:

- `position`: resolved `UDim2` position for the positioned content.
- `anchorPoint`: resolved anchor point to pair with the computed position.
- `placement`: final resolved placement after collision handling.
- `contentSize`: measured content size used by placement and centering logic.
- `isPositioned`: whether a full anchor+content measurement has produced a positioned result.
- `update`: callback to force a positioning recompute.

## Status

`@lattice-ui/popper` is still experimental and evolving; APIs and behavior may continue to change as positioning surfaces mature.
