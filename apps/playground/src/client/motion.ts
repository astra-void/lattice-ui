import type { MotionTransition } from "@lattice-ui/core";

const OVERLAY_TWEEN_INFO = new TweenInfo(0.14, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);
const SURFACE_TWEEN_INFO = new TweenInfo(0.16, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);
const SURFACE_EXIT_TWEEN_INFO = new TweenInfo(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.In);
const INDICATOR_TWEEN_INFO = new TweenInfo(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);
const INDICATOR_EXIT_TWEEN_INFO = new TweenInfo(0.08, Enum.EasingStyle.Quad, Enum.EasingDirection.In);
const THUMB_TWEEN_INFO = new TweenInfo(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);
const THUMB_EXIT_TWEEN_INFO = new TweenInfo(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.In);

export const playgroundOverlayTransition = {
  enter: {
    tweenInfo: OVERLAY_TWEEN_INFO,
    from: {
      BackgroundTransparency: 1,
    },
    to: {
      BackgroundTransparency: 0.35,
    },
  },
  exit: {
    tweenInfo: OVERLAY_TWEEN_INFO,
    to: {
      BackgroundTransparency: 1,
    },
  },
} satisfies MotionTransition;

export const playgroundSurfaceTransition = {
  enter: {
    tweenInfo: SURFACE_TWEEN_INFO,
    from: {
      Position: UDim2.fromOffset(0, 8),
      BackgroundTransparency: 1,
    },
    to: {
      Position: UDim2.fromOffset(0, 0),
      BackgroundTransparency: 0,
    },
  },
  exit: {
    tweenInfo: SURFACE_EXIT_TWEEN_INFO,
    to: {
      Position: UDim2.fromOffset(0, 8),
      BackgroundTransparency: 1,
    },
  },
} satisfies MotionTransition;

export const playgroundTooltipTransition = {
  enter: {
    tweenInfo: SURFACE_TWEEN_INFO,
    from: {
      Position: UDim2.fromOffset(0, 6),
      BackgroundTransparency: 1,
    },
    to: {
      Position: UDim2.fromOffset(0, 0),
      BackgroundTransparency: 0,
    },
  },
  exit: {
    tweenInfo: SURFACE_EXIT_TWEEN_INFO,
    to: {
      Position: UDim2.fromOffset(0, 6),
      BackgroundTransparency: 1,
    },
  },
} satisfies MotionTransition;

export const playgroundAccordionTransition = {
  enter: {
    tweenInfo: SURFACE_TWEEN_INFO,
    from: {
      Position: UDim2.fromOffset(0, 6),
      BackgroundTransparency: 1,
    },
    to: {
      Position: UDim2.fromOffset(0, 0),
      BackgroundTransparency: 0,
    },
  },
  exit: {
    tweenInfo: SURFACE_EXIT_TWEEN_INFO,
    to: {
      Position: UDim2.fromOffset(0, 6),
      BackgroundTransparency: 1,
    },
  },
} satisfies MotionTransition;

export const playgroundTabsTransition = {
  enter: {
    tweenInfo: SURFACE_TWEEN_INFO,
    from: {
      Position: UDim2.fromOffset(0, 6),
      BackgroundTransparency: 1,
    },
    to: {
      Position: UDim2.fromOffset(0, 0),
      BackgroundTransparency: 0,
    },
  },
  exit: {
    tweenInfo: SURFACE_EXIT_TWEEN_INFO,
    to: {
      Position: UDim2.fromOffset(0, 6),
      BackgroundTransparency: 1,
    },
  },
} satisfies MotionTransition;

export const playgroundIndicatorTransition = {
  enter: {
    tweenInfo: INDICATOR_TWEEN_INFO,
    from: {
      Size: UDim2.fromOffset(0, 0),
      BackgroundTransparency: 1,
    },
    to: {
      Size: UDim2.fromOffset(12, 12),
      BackgroundTransparency: 0,
    },
  },
  exit: {
    tweenInfo: INDICATOR_EXIT_TWEEN_INFO,
    to: {
      Size: UDim2.fromOffset(0, 0),
      BackgroundTransparency: 1,
    },
  },
} satisfies MotionTransition;

export const playgroundSwitchThumbTransition = {
  enter: {
    tweenInfo: THUMB_TWEEN_INFO,
    from: {
      Position: UDim2.fromOffset(2, 2),
    },
    to: {
      Position: new UDim2(1, -18, 0, 2),
    },
  },
  exit: {
    tweenInfo: THUMB_EXIT_TWEEN_INFO,
    to: {
      Position: UDim2.fromOffset(2, 2),
    },
  },
} satisfies MotionTransition;

export const playgroundToastTransition = {
  enter: {
    tweenInfo: SURFACE_TWEEN_INFO,
    from: {
      BackgroundTransparency: 1,
    },
    to: {
      BackgroundTransparency: 0,
    },
  },
  exit: {
    tweenInfo: SURFACE_EXIT_TWEEN_INFO,
    to: {
      BackgroundTransparency: 1,
    },
  },
} satisfies MotionTransition;
