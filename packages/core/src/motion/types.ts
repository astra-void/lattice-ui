import type React from "@rbxts/react";

export type MotionProperties = Record<string, unknown>;

export type MotionKeyframe = {
  tweenInfo?: TweenInfo;
  from?: MotionProperties;
  to?: MotionProperties;
};

export type MotionTransition = {
  enter?: MotionKeyframe;
  exit?: MotionKeyframe;
};

export type MotionPolicyValue = {
  disableAllMotion: boolean;
};

export type MotionPolicyProviderProps = {
  disableAllMotion?: boolean;
  children?: React.ReactNode;
};

export type UseMotionTweenOptions = {
  active: boolean;
  transition?: MotionTransition | false;
  onExitComplete?: () => void;
};
