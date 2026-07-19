import type { NavDirection, ResolvedFocusNode } from "../types";

// Cross-axis distance is penalised so that a candidate roughly in line with the
// current node is preferred over a closer one that is far off to the side.
const CROSS_AXIS_PENALTY = 2;

function getCenter(guiObject: GuiObject): Vector2 {
  const position = guiObject.AbsolutePosition;
  const size = guiObject.AbsoluteSize;
  return new Vector2(position.X + size.X / 2, position.Y + size.Y / 2);
}

function getDirectionVector(direction: NavDirection): Vector2 {
  if (direction === "up") {
    return new Vector2(0, -1);
  }
  if (direction === "down") {
    return new Vector2(0, 1);
  }
  if (direction === "left") {
    return new Vector2(-1, 0);
  }
  return new Vector2(1, 0);
}

// Picks the best candidate in the pressed direction using screen geometry.
// Comparing centre points is GUI-inset invariant because every AbsolutePosition
// shares the same inset offset, so it cancels out in the delta.
export function findSpatialTarget(
  current: ResolvedFocusNode,
  candidates: Array<ResolvedFocusNode>,
  direction: NavDirection,
): ResolvedFocusNode | undefined {
  const origin = getCenter(current.guiObject);
  const axis = getDirectionVector(direction);

  let best: ResolvedFocusNode | undefined;
  let bestScore = math.huge;

  for (const candidate of candidates) {
    if (candidate.record.id === current.record.id) {
      continue;
    }

    const delta = getCenter(candidate.guiObject).sub(origin);
    const along = delta.X * axis.X + delta.Y * axis.Y;
    if (along <= 0) {
      continue;
    }

    // Perpendicular offset from the direction axis.
    const cross = math.abs(delta.X * axis.Y - delta.Y * axis.X);
    const score = along + cross * CROSS_AXIS_PENALTY;
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best;
}
