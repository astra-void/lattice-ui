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

function getOverflowDistance(
  positionX: number,
  positionY: number,
  contentSize: Vector2,
  viewportRect: Rect,
  padding: number,
) {
  const minX = viewportRect.Min.X + padding;
  const minY = viewportRect.Min.Y + padding;
  // Prevent negative max boundaries if content is larger than viewport
  const maxX = math.max(minX, viewportRect.Max.X - contentSize.X - padding);
  const maxY = math.max(minY, viewportRect.Max.Y - contentSize.Y - padding);

  let overflowX = 0;
  if (positionX < minX) {
    overflowX = minX - positionX;
  } else if (positionX > maxX) {
    overflowX = positionX - maxX;
  }

  let overflowY = 0;
  if (positionY < minY) {
    overflowY = minY - positionY;
  } else if (positionY > maxY) {
    overflowY = positionY - maxY;
  }

  return overflowX + overflowY;
}

function clampToViewport(
  positionX: number,
  positionY: number,
  contentSize: Vector2,
  viewportRect: Rect,
  padding: number,
  out: XY,
): XY {
  const minX = viewportRect.Min.X + padding;
  const minY = viewportRect.Min.Y + padding;
  const maxX = math.max(minX, viewportRect.Max.X - contentSize.X - padding);
  const maxY = math.max(minY, viewportRect.Max.Y - contentSize.Y - padding);

  out.x = math.clamp(positionX, minX, maxX);
  out.y = math.clamp(positionY, minY, maxY);
  return out;
}

const OPPOSITE_PLACEMENTS: Record<PopperPlacement, PopperPlacement> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

const ORTHOGONAL_PLACEMENTS: Record<PopperPlacement, [PopperPlacement, PopperPlacement]> = {
  top: ["right", "left"],
  bottom: ["right", "left"],
  left: ["bottom", "top"],
  right: ["bottom", "top"],
};

function getPlacementOrder(requested: PopperPlacement): PopperPlacement[] {
  return [
    requested,
    OPPOSITE_PLACEMENTS[requested],
    ORTHOGONAL_PLACEMENTS[requested][0],
    ORTHOGONAL_PLACEMENTS[requested][1],
  ];
}

function getAnchorPointForPlacement(placement: PopperPlacement): Vector2 {
  if (placement === "top") return new Vector2(0.5, 1);
  if (placement === "bottom") return new Vector2(0.5, 0);
  if (placement === "left") return new Vector2(1, 0.5);
  return new Vector2(0, 0.5); // right
}

export function computePopper(input: ComputePopperInput): ComputePopperResult {
  const requested = input.placement ?? "bottom";
  const offset = input.offset ?? new Vector2(0, 0);
  const padding = input.padding ?? 8;

  let bestPlacement = requested;
  let bestPos = { x: 0, y: 0 };
  let bestScore = -1; // -1 indicates unset

  const order = getPlacementOrder(requested);

  for (const placement of order) {
    const pos = getPositionForPlacement(placement, input.anchorPosition, input.anchorSize, input.contentSize, offset, {
      x: 0,
      y: 0,
    });

    const score = getOverflowDistance(pos.x, pos.y, input.contentSize, input.viewportRect, padding);

    if (score === 0) {
      bestPlacement = placement;
      bestPos = pos;
      break; // Perfect fit, use immediately
    }

    if (bestScore === -1 || score < bestScore) {
      bestPlacement = placement;
      bestPos = pos;
      bestScore = score;
    }
  }

  // Clamp the least-bad candidate
  const clamped = clampToViewport(bestPos.x, bestPos.y, input.contentSize, input.viewportRect, padding, { x: 0, y: 0 });

  // Derive meaningful attachment metadata
  const anchorPoint = getAnchorPointForPlacement(bestPlacement);

  // Convert from TopLeft (clamped) to the visual origin using anchorPoint
  const finalX = clamped.x + anchorPoint.X * input.contentSize.X;
  const finalY = clamped.y + anchorPoint.Y * input.contentSize.Y;

  return {
    position: UDim2.fromOffset(finalX, finalY),
    anchorPoint,
    placement: bestPlacement,
  };
}
