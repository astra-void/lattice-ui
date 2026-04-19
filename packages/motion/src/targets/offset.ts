export type MotionPlacement = "top" | "bottom" | "left" | "right";

export function createPlacementOffset(placement: MotionPlacement | undefined, distance: number) {
  const resolvedPlacement = placement ?? "bottom";

  if (resolvedPlacement === "top") {
    return UDim2.fromOffset(0, -distance);
  }

  if (resolvedPlacement === "bottom") {
    return UDim2.fromOffset(0, distance);
  }

  if (resolvedPlacement === "left") {
    return UDim2.fromOffset(-distance, 0);
  }

  if (resolvedPlacement === "right") {
    return UDim2.fromOffset(distance, 0);
  }

  return UDim2.fromOffset(0, distance);
}
