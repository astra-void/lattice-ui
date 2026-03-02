import type { ComputePopperInput, ComputePopperResult, PopperPlacement } from "./types";

function getPositionForPlacement(
  placement: PopperPlacement,
  anchorPosition: Vector2,
  anchorSize: Vector2,
  contentSize: Vector2,
  offset: Vector2,
) {
  if (placement === "top") {
    return new Vector2(
      anchorPosition.X + anchorSize.X / 2 - contentSize.X / 2 + offset.X,
      anchorPosition.Y - contentSize.Y + offset.Y,
    );
  }

  if (placement === "left") {
    return new Vector2(
      anchorPosition.X - contentSize.X + offset.X,
      anchorPosition.Y + anchorSize.Y / 2 - contentSize.Y / 2 + offset.Y,
    );
  }

  if (placement === "right") {
    return new Vector2(
      anchorPosition.X + anchorSize.X + offset.X,
      anchorPosition.Y + anchorSize.Y / 2 - contentSize.Y / 2 + offset.Y,
    );
  }

  return new Vector2(
    anchorPosition.X + anchorSize.X / 2 - contentSize.X / 2 + offset.X,
    anchorPosition.Y + anchorSize.Y + offset.Y,
  );
}

function overflowsViewport(position: Vector2, contentSize: Vector2, viewportSize: Vector2, padding: number) {
  const minX = padding;
  const minY = padding;
  const maxX = viewportSize.X - contentSize.X - padding;
  const maxY = viewportSize.Y - contentSize.Y - padding;
  return position.X < minX || position.X > maxX || position.Y < minY || position.Y > maxY;
}

function clampToViewport(position: Vector2, contentSize: Vector2, viewportSize: Vector2, padding: number) {
  const minX = padding;
  const minY = padding;
  const maxX = math.max(minX, viewportSize.X - contentSize.X - padding);
  const maxY = math.max(minY, viewportSize.Y - contentSize.Y - padding);

  return new Vector2(math.clamp(position.X, minX, maxX), math.clamp(position.Y, minY, maxY));
}

export function computePopper(input: ComputePopperInput): ComputePopperResult {
  const placement = input.placement ?? "bottom";
  const offset = input.offset ?? new Vector2(0, 0);
  const padding = input.padding ?? 8;

  const primary = getPositionForPlacement(placement, input.anchorPosition, input.anchorSize, input.contentSize, offset);

  const fallbackPlacement: PopperPlacement =
    placement === "top" ? "bottom" : placement === "bottom" ? "top" : placement === "left" ? "right" : "left";

  let resolvedPlacement = placement;
  let resolvedPosition = primary;

  if (overflowsViewport(primary, input.contentSize, input.viewportSize, padding)) {
    const fallback = getPositionForPlacement(
      fallbackPlacement,
      input.anchorPosition,
      input.anchorSize,
      input.contentSize,
      offset,
    );

    if (!overflowsViewport(fallback, input.contentSize, input.viewportSize, padding)) {
      resolvedPlacement = fallbackPlacement;
      resolvedPosition = fallback;
    }
  }

  const clampedPosition = clampToViewport(resolvedPosition, input.contentSize, input.viewportSize, padding);

  return {
    position: UDim2.fromOffset(clampedPosition.X, clampedPosition.Y),
    anchorPoint: new Vector2(0, 0),
    placement: resolvedPlacement,
  };
}
