export type MotionPlacement = "top" | "bottom" | "left" | "right";

export function createPlacementOffset(placement: MotionPlacement | undefined, distance: number) {
  if (placement === "top") {
    return UDim2.fromOffset(0, distance);
  }

  if (placement === "bottom") {
    return UDim2.fromOffset(0, -distance);
  }

  if (placement === "left") {
    return UDim2.fromOffset(distance, 0);
  }

  if (placement === "right") {
    return UDim2.fromOffset(-distance, 0);
  }

  return UDim2.fromOffset(0, distance);
}
