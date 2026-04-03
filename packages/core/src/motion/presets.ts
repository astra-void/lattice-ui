import type { MotionTransition } from "./types";

export const EASING = {
  enter: Enum.EasingDirection.Out,
  exit: Enum.EasingDirection.In,
  standard: Enum.EasingStyle.Quad,
};

export const DURATIONS = {
  fast: 0.1,
  base: 0.12,
  slow: 0.2,
};

export const MOTION_PRESETS = {
  surfaceEnter: new TweenInfo(DURATIONS.base, EASING.standard, EASING.enter),
  surfaceExit: new TweenInfo(DURATIONS.fast, EASING.standard, EASING.exit),
  indicatorEnter: new TweenInfo(DURATIONS.base, EASING.standard, EASING.enter),
  indicatorExit: new TweenInfo(DURATIONS.fast, EASING.standard, EASING.exit),
};

export function buildTweenTransition(
  enterTo: Record<string, unknown>,
  exitTo: Record<string, unknown>,
  options?: { enterTweenInfo?: TweenInfo; exitTweenInfo?: TweenInfo },
): MotionTransition {
  return {
    enter: {
      tweenInfo: options?.enterTweenInfo ?? MOTION_PRESETS.surfaceEnter,
      to: enterTo,
    },
    exit: {
      tweenInfo: options?.exitTweenInfo ?? MOTION_PRESETS.surfaceExit,
      to: exitTo,
    },
  };
}

export function buildColorTransition(
  enterColor: Color3,
  exitColor: Color3,
  options?: { enterTweenInfo?: TweenInfo; exitTweenInfo?: TweenInfo },
): MotionTransition {
  return buildTweenTransition({ BackgroundColor3: enterColor }, { BackgroundColor3: exitColor }, options);
}

export function buildTextColorTransition(
  enterColor: Color3,
  exitColor: Color3,
  options?: { enterTweenInfo?: TweenInfo; exitTweenInfo?: TweenInfo },
): MotionTransition {
  return buildTweenTransition({ TextColor3: enterColor }, { TextColor3: exitColor }, options);
}

export function buildTransparencyTransition(
  enterTransparency: number,
  exitTransparency: number,
  options?: { enterTweenInfo?: TweenInfo; exitTweenInfo?: TweenInfo },
): MotionTransition {
  return buildTweenTransition(
    { BackgroundTransparency: enterTransparency },
    { BackgroundTransparency: exitTransparency },
    options,
  );
}
