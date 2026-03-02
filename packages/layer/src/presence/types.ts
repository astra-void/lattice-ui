import type React from "@rbxts/react";

export type PresenceRenderState = {
  isPresent: boolean;
  onExitComplete: () => void;
};

export type PresenceProps = {
  present: boolean;
  exitFallbackMs?: number;
  onExitComplete?: () => void;
  children: (state: PresenceRenderState) => React.ReactElement | undefined;
};
