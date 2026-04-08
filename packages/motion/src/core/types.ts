export type MotionTempo = "instant" | "swift" | "steady" | "gentle";
export type MotionTone = "calm" | "responsive" | "expressive";
export type MotionDomain = "presence" | "response" | "feedback";

export type MotionIntent = {
  tempo?: MotionTempo;
  tone?: MotionTone;
  duration?: number;
};

export type MotionProperties = Record<string, unknown>;

export type MotionStep = {
  values: MotionProperties;
  intent?: MotionIntent;
};

export interface PresenceMotionConfig {
  initial?: MotionProperties;
  reveal?: MotionStep;
  exit?: MotionStep;
}

export interface ResponseMotionConfig {
  settle?: MotionIntent;
}

export interface FeedbackEffectConfig {
  accent?: MotionIntent;
  recover?: MotionIntent;
}

export type MotionStateTargets = {
  active: MotionProperties;
  inactive: MotionProperties;
};

export type MotionPolicy = {
  mode: "full" | "none";
  disableAllMotion: boolean;
};
