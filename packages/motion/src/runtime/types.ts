export type MotionConfigPhase = {
  tweenInfo?: TweenInfo;
  goals?: Record<string, unknown>;
  initial?: Record<string, unknown>;
};

export type MotionConfig = {
  entering?: MotionConfigPhase;
  entered?: MotionConfigPhase;
  exiting?: MotionConfigPhase;
};
