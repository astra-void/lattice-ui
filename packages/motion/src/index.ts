// Runtime
export * from "./hooks/useIndicatorMotion";
// Hooks
export * from "./hooks/useOverlayMotion";
export * from "./hooks/usePopperSurfaceMotion";
export * from "./hooks/useStateMotion";
export * from "./hooks/useSurfaceMotion";
export * from "./hooks/useToggleMotion";
export * from "./recipes/accordion";
export * from "./recipes/indicator";
export * from "./recipes/overlay";
export * from "./recipes/popper-surface";
export * from "./recipes/surface";
// Recipes
export * from "./recipes/timings";
export * from "./recipes/toggle";
export * from "./runtime/motion-controller";
export * from "./runtime/motion-phase";
export * from "./runtime/motion-policy";
export * from "./runtime/motion-presence";
export * from "./runtime/types";
// Targets
export * from "./targets/apply";
export * from "./targets/color";
export * from "./targets/indicator";
export * from "./targets/offset";
export * from "./targets/overlay";
export * from "./targets/size";
export * from "./targets/surface";
export * from "./targets/toggle";
export function buildTweenTransition(
  enterTo: Record<string, unknown>,
  exitTo: Record<string, unknown>,
  options?: { enterTweenInfo?: TweenInfo; exitTweenInfo?: TweenInfo },
) {
  return {
    entering: {
      tweenInfo: options?.enterTweenInfo,
      goals: enterTo,
    },
    entered: {
      goals: enterTo,
    },
    exiting: {
      tweenInfo: options?.exitTweenInfo,
      goals: exitTo,
    },
  };
}
export const MOTION_PRESETS = {
  surfaceEnter: new TweenInfo(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
  surfaceExit: new TweenInfo(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
  indicatorEnter: new TweenInfo(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
  indicatorExit: new TweenInfo(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
};
export function buildColorTransition(
  enterColor: Color3,
  exitColor: Color3,
  options?: { enterTweenInfo?: TweenInfo; exitTweenInfo?: TweenInfo },
) {
  return buildTweenTransition({ BackgroundColor3: enterColor }, { BackgroundColor3: exitColor }, options);
}

export function buildTextColorTransition(
  enterColor: Color3,
  exitColor: Color3,
  options?: { enterTweenInfo?: TweenInfo; exitTweenInfo?: TweenInfo },
) {
  return buildTweenTransition({ TextColor3: enterColor }, { TextColor3: exitColor }, options);
}

export function buildTransparencyTransition(
  enterTransparency: number,
  exitTransparency: number,
  options?: { enterTweenInfo?: TweenInfo; exitTweenInfo?: TweenInfo },
) {
  return buildTweenTransition(
    { BackgroundTransparency: enterTransparency },
    { BackgroundTransparency: exitTransparency },
    options,
  );
}
