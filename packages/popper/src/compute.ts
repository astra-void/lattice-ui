import type { ComputePopperInput, ComputePopperResult, PopperPlacement } from "./types";

type XY = {
  x: number;
  y: number;
};

function getPositionForPlacement(
  placement: PopperPlacement,
  anchorPosition: Vector2,
  anchorSize: Vector2,
  contentSize: Vector2,
  offset: Vector2,
  out: XY,
): XY {
  if (placement === "top") {
    out.x = anchorPosition.X + anchorSize.X / 2 - contentSize.X / 2 + offset.X;
    out.y = anchorPosition.Y - contentSize.Y + offset.Y;
    return out;
  }

  if (placement === "left") {
    out.x = anchorPosition.X - contentSize.X + offset.X;
    out.y = anchorPosition.Y + anchorSize.Y / 2 - contentSize.Y / 2 + offset.Y;
    return out;
  }

  if (placement === "right") {
    out.x = anchorPosition.X + anchorSize.X + offset.X;
    out.y = anchorPosition.Y + anchorSize.Y / 2 - contentSize.Y / 2 + offset.Y;
    return out;
  }

  out.x = anchorPosition.X + anchorSize.X / 2 - contentSize.X / 2 + offset.X;
  out.y = anchorPosition.Y + anchorSize.Y + offset.Y;
  return out;
}

function overflowsViewport(
  positionX: number,
  positionY: number,
  contentSize: Vector2,
  viewportSize: Vector2,
  padding: number,
) {
  const minX = padding;
  const minY = padding;
  const maxX = viewportSize.X - contentSize.X - padding;
  const maxY = viewportSize.Y - contentSize.Y - padding;
  return positionX < minX || positionX > maxX || positionY < minY || positionY > maxY;
}

function clampToViewport(
  positionX: number,
  positionY: number,
  contentSize: Vector2,
  viewportSize: Vector2,
  padding: number,
  out: XY,
): XY {
  const minX = padding;
  const minY = padding;
  const maxX = math.max(minX, viewportSize.X - contentSize.X - padding);
  const maxY = math.max(minY, viewportSize.Y - contentSize.Y - padding);

  out.x = math.clamp(positionX, minX, maxX);
  out.y = math.clamp(positionY, minY, maxY);
  return out;
}

export function computePopper(input: ComputePopperInput): ComputePopperResult {
  const placement = input.placement ?? "bottom";
  const offset = input.offset ?? new Vector2(0, 0);
  const padding = input.padding ?? 8;

  const primary = getPositionForPlacement(
    placement,
    input.anchorPosition,
    input.anchorSize,
    input.contentSize,
    offset,
    { x: 0, y: 0 },
  );

  const fallbackPlacement: PopperPlacement =
    placement === "top" ? "bottom" : placement === "bottom" ? "top" : placement === "left" ? "right" : "left";

  let resolvedPlacement = placement;
  let resolvedX = primary.x;
  let resolvedY = primary.y;

  if (overflowsViewport(primary.x, primary.y, input.contentSize, input.viewportSize, padding)) {
    const fallback = getPositionForPlacement(
      fallbackPlacement,
      input.anchorPosition,
      input.anchorSize,
      input.contentSize,
      offset,
      { x: 0, y: 0 },
    );

    if (!overflowsViewport(fallback.x, fallback.y, input.contentSize, input.viewportSize, padding)) {
      resolvedPlacement = fallbackPlacement;
      resolvedX = fallback.x;
      resolvedY = fallback.y;
    }
  }

  const clamped = clampToViewport(resolvedX, resolvedY, input.contentSize, input.viewportSize, padding, { x: 0, y: 0 });

  return {
    position: UDim2.fromOffset(clamped.x, clamped.y),
    anchorPoint: new Vector2(0, 0),
    placement: resolvedPlacement,
  };
}
