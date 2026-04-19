import type { NormalizedPopperPositioningOptions, PopperPlacement, PopperPositioningOptions } from "./types";

const DEFAULT_PLACEMENT: PopperPlacement = "bottom";
const DEFAULT_COLLISION_PADDING = 8;

export function normalizePopperPositioningOptions(
  options?: PopperPositioningOptions,
): NormalizedPopperPositioningOptions {
  const placement = options?.placement ?? DEFAULT_PLACEMENT;

  return {
    placement,
    sideOffset: options?.sideOffset ?? 0,
    alignOffset: options?.alignOffset ?? 0,
    collisionPadding: options?.collisionPadding ?? DEFAULT_COLLISION_PADDING,
  };
}
