import { motionTargets, type PresenceMotionConfig } from "../core/types";
import type { MotionPlacement } from "../targets/offset";
import { createPlacementOffset } from "../targets/offset";

export function createSurfaceRevealRecipe(offsetY = 4, duration = 0.12): PresenceMotionConfig {
  return {
    target: motionTargets.offsetWrapper("surface reveal"),
    initial: {
      Position: UDim2.fromOffset(0, offsetY),
      BackgroundTransparency: 1,
    },
    reveal: {
      values: {
        Position: UDim2.fromOffset(0, 0),
        BackgroundTransparency: 0,
      },
      intent: { duration, tempo: "steady", tone: "calm" },
    },
    exit: {
      values: {
        Position: UDim2.fromOffset(0, offsetY),
        BackgroundTransparency: 1,
      },
      intent: { duration, tempo: "swift", tone: "calm" },
    },
  };
}

export function createCanvasGroupRevealRecipe(offsetY = 4, duration = 0.12): PresenceMotionConfig {
  return {
    target: motionTargets.offsetWrapper("canvas group reveal"),
    initial: {
      Position: UDim2.fromOffset(0, offsetY),
      GroupTransparency: 1,
    },
    reveal: {
      values: {
        Position: UDim2.fromOffset(0, 0),
        GroupTransparency: 0,
      },
      intent: { duration, tempo: "steady", tone: "calm" },
    },
    exit: {
      values: {
        Position: UDim2.fromOffset(0, offsetY),
        GroupTransparency: 1,
      },
      intent: { duration, tempo: "swift", tone: "calm" },
    },
  };
}

export function createOverlayFadeRecipe(duration = 0.15): PresenceMotionConfig {
  return {
    target: motionTargets.appearance("overlay fade"),
    initial: { BackgroundTransparency: 1 },
    reveal: {
      values: { BackgroundTransparency: 0.5 },
      intent: { duration, tempo: "steady", tone: "calm" },
    },
    exit: {
      values: { BackgroundTransparency: 1 },
      intent: { duration, tempo: "swift", tone: "calm" },
    },
  };
}

export function createPopperEntranceRecipe(
  placement?: MotionPlacement,
  distance = 4,
  duration = 0.1,
): PresenceMotionConfig {
  const offset = createPlacementOffset(placement, distance);

  return {
    target: motionTargets.offsetWrapper("popper entrance"),
    initial: {
      Position: offset,
      BackgroundTransparency: 1,
    },
    reveal: {
      values: {
        Position: UDim2.fromOffset(0, 0),
        BackgroundTransparency: 0,
      },
      intent: { duration, tempo: "swift", tone: "responsive" },
    },
    exit: {
      values: {
        Position: offset,
        BackgroundTransparency: 1,
      },
      intent: { duration: duration * 0.8, tempo: "swift", tone: "calm" },
    },
  };
}

export function createCanvasGroupPopperEntranceRecipe(
  placement?: MotionPlacement,
  distance = 10,
  duration = 0.12,
): PresenceMotionConfig {
  const offset = createPlacementOffset(placement, distance);

  return {
    target: motionTargets.offsetWrapper("canvas group popper entrance"),
    initial: {
      Position: offset,
      GroupTransparency: 1,
    },
    reveal: {
      values: {
        Position: UDim2.fromOffset(0, 0),
        GroupTransparency: 0,
      },
      intent: { duration, tempo: "swift", tone: "responsive" },
    },
    exit: {
      values: {
        Position: offset,
        GroupTransparency: 1,
      },
      intent: { duration: duration * 0.8, tempo: "swift", tone: "calm" },
    },
  };
}

export function createIndicatorRevealRecipe(size: UDim2, duration = 0.1): PresenceMotionConfig {
  return {
    target: motionTargets.sizeWrapper("indicator reveal"),
    initial: {
      Size: UDim2.fromOffset(0, 0),
      BackgroundTransparency: 1,
    },
    reveal: {
      values: {
        Size: size,
        BackgroundTransparency: 0,
      },
      intent: { duration, tempo: "swift", tone: "expressive" },
    },
    exit: {
      values: {
        Size: UDim2.fromOffset(0, 0),
        BackgroundTransparency: 1,
      },
      intent: { duration: duration * 0.8, tempo: "swift", tone: "calm" },
    },
  };
}
