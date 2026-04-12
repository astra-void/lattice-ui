export type MotionTempo = "instant" | "swift" | "steady" | "gentle";
export type MotionTone = "calm" | "responsive" | "expressive";
export type MotionDomain = "presence" | "response" | "feedback";
export type MotionTargetRole = "appearance" | "offset-wrapper" | "size-wrapper" | "layout" | "custom";
export type PresenceMotionPhase = "exited" | "mounted" | "preparing" | "ready" | "visible" | "exiting";

export type MotionIntent = {
  tempo?: MotionTempo;
  tone?: MotionTone;
  duration?: number;
};

export type MotionProperties = Record<string, unknown>;

export type MotionTargetContract = {
  /**
   * Describes the ownership boundary for the instance passed to MotionHost.
   *
   * - appearance: direct visual properties only
   * - offset-wrapper: an isolated child/wrapper whose Position is motion-owned
   * - size-wrapper: an isolated child/wrapper whose Size is motion-owned
   * - layout: the component has deliberately delegated layout properties to motion
   * - custom: only allowProperties are motion-owned
   */
  role: MotionTargetRole;
  label?: string;
  allowProperties?: Array<string>;
  denyProperties?: Array<string>;
};

export type MotionStep = {
  values: MotionProperties;
  intent?: MotionIntent;
  target?: MotionTargetContract;
};

export interface PresenceMotionConfig {
  target?: MotionTargetContract;
  initial?: MotionProperties;
  reveal?: MotionStep;
  exit?: MotionStep;
}

export interface ResponseMotionConfig {
  target?: MotionTargetContract;
  settle?: MotionIntent;
}

export interface FeedbackEffectConfig {
  target?: MotionTargetContract;
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

export type MotionTargetContractOptions = Omit<MotionTargetContract, "role">;

export function createMotionTargetContract(
  role: MotionTargetRole,
  options?: MotionTargetContractOptions,
): MotionTargetContract {
  return {
    role,
    label: options?.label,
    allowProperties: options?.allowProperties,
    denyProperties: options?.denyProperties,
  };
}

export const motionTargets = {
  appearance: (label?: string) => createMotionTargetContract("appearance", { label }),
  offsetWrapper: (label?: string) => createMotionTargetContract("offset-wrapper", { label }),
  sizeWrapper: (label?: string) => createMotionTargetContract("size-wrapper", { label }),
  layout: (label?: string) => createMotionTargetContract("layout", { label }),
  custom: (options: MotionTargetContractOptions) => createMotionTargetContract("custom", options),
};
