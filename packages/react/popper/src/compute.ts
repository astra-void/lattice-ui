import { normalizePopperPositioningOptions } from "./options";
import type { ComputePopperInput, ComputePopperResult, PopperPlacement } from "./types";

type XY = {
  x: number;
  y: number;
};

const ORTHOGONAL_PLACEMENT_PENALTY = 12;

function getBasePositionForPlacement(
  placement: PopperPlacement,
  anchorPosition: Vector2,
  anchorSize: Vector2,
  contentSize: Vector2,
  out: XY,
): XY {
  if (placement === "top") {
    out.x = anchorPosition.X + anchorSize.X / 2 - contentSize.X / 2;
    out.y = anchorPosition.Y - contentSize.Y;
    return out;
  }

  if (placement === "left") {
    out.x = anchorPosition.X - contentSize.X;
    out.y = anchorPosition.Y + anchorSize.Y / 2 - contentSize.Y / 2;
    return out;
  }

  if (placement === "right") {
    out.x = anchorPosition.X + anchorSize.X;
    out.y = anchorPosition.Y + anchorSize.Y / 2 - contentSize.Y / 2;
    return out;
  }

  out.x = anchorPosition.X + anchorSize.X / 2 - contentSize.X / 2;
  out.y = anchorPosition.Y + anchorSize.Y;
  return out;
}

function applyPlacementOffsets(placement: PopperPlacement, sideOffset: number, alignOffset: number, out: XY): XY {
  if (placement === "top") {
    out.x += alignOffset;
    out.y -= sideOffset;
    return out;
  }

  if (placement === "left") {
    out.x -= sideOffset;
    out.y += alignOffset;
    return out;
  }

  if (placement === "right") {
    out.x += sideOffset;
    out.y += alignOffset;
    return out;
  }

  out.x += alignOffset;
  out.y += sideOffset;
  return out;
}

function getPositionForPlacement(
  placement: PopperPlacement,
  anchorPosition: Vector2,
  anchorSize: Vector2,
  contentSize: Vector2,
  sideOffset: number,
  alignOffset: number,
  out: XY,
): XY {
  const basePosition = getBasePositionForPlacement(placement, anchorPosition, anchorSize, contentSize, out);
  applyPlacementOffsets(placement, sideOffset, alignOffset, basePosition);
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

function getPlacementPenalty(requested: PopperPlacement, placement: PopperPlacement) {
  if (placement === requested || placement === OPPOSITE_PLACEMENTS[requested]) {
    return 0;
  }

  return ORTHOGONAL_PLACEMENT_PENALTY;
}

function getAnchorPointForPlacement(placement: PopperPlacement): Vector2 {
  if (placement === "top") return new Vector2(0.5, 1);
  if (placement === "bottom") return new Vector2(0.5, 0);
  if (placement === "left") return new Vector2(1, 0.5);
  return new Vector2(0, 0.5); // right
}

export function computePopper(input: ComputePopperInput): ComputePopperResult {
  const normalized = normalizePopperPositioningOptions(input);
  const requested = normalized.placement;

  let bestPlacement = requested;
  let bestPos = { x: 0, y: 0 };
  let bestScore = -1; // -1 indicates unset
  let bestOverflow = math.huge;

  const order = getPlacementOrder(requested);

  for (const placement of order) {
    const pos = getPositionForPlacement(
      placement,
      input.anchorPosition,
      input.anchorSize,
      input.contentSize,
      normalized.sideOffset,
      normalized.alignOffset,
      {
        x: 0,
        y: 0,
      },
    );

    const overflow = getOverflowDistance(
      pos.x,
      pos.y,
      input.contentSize,
      input.viewportRect,
      normalized.collisionPadding,
    );
    const score = overflow + getPlacementPenalty(requested, placement);

    if (score === 0) {
      bestPlacement = placement;
      bestPos = pos;
      bestOverflow = overflow;
      break; // Perfect fit, use immediately
    }

    if (bestScore === -1 || score < bestScore || (score === bestScore && overflow < bestOverflow)) {
      bestPlacement = placement;
      bestPos = pos;
      bestScore = score;
      bestOverflow = overflow;
    }
  }

  // Clamp the least-bad candidate
  const clamped = clampToViewport(
    bestPos.x,
    bestPos.y,
    input.contentSize,
    input.viewportRect,
    normalized.collisionPadding,
    { x: 0, y: 0 },
  );

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
