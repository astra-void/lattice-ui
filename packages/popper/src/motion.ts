import type { MotionTransition } from "@lattice-ui/core";
import type { PopperPlacement } from "./types";

type BuildPopperContentMotionTransitionOptions = {
  distance?: number;
  enterTweenInfo?: TweenInfo;
  exitTweenInfo?: TweenInfo;
};

function getPlacementOffset(placement: PopperPlacement, distance: number) {
  if (placement === "top") {
    return UDim2.fromOffset(0, -distance);
  }

  if (placement === "left") {
    return UDim2.fromOffset(-distance, 0);
  }

  if (placement === "right") {
    return UDim2.fromOffset(distance, 0);
  }

  return UDim2.fromOffset(0, distance);
}

export function buildPopperContentMotionTransition(
  placement: PopperPlacement,
  options?: BuildPopperContentMotionTransitionOptions,
) {
  const offset = getPlacementOffset(placement, options?.distance ?? 6);

  return {
    enter: {
      tweenInfo: options?.enterTweenInfo,
      from: {
        Position: offset,
      },
      to: {
        Position: UDim2.fromOffset(0, 0),
      },
    },
    exit: {
      tweenInfo: options?.exitTweenInfo,
      from: {
        Position: UDim2.fromOffset(0, 0),
      },
      to: {
        Position: offset,
      },
    },
  } satisfies MotionTransition;
}
