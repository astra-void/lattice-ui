export function getOffsetTargetProps(placement: string, distance: number) {
  if (placement === "top") return { Position: UDim2.fromOffset(0, -distance) };
  if (placement === "left") return { Position: UDim2.fromOffset(-distance, 0) };
  if (placement === "right") return { Position: UDim2.fromOffset(distance, 0) };
  return { Position: UDim2.fromOffset(0, distance) };
}
