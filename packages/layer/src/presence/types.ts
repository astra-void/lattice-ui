import type React from "@rbxts/react";

export type PresenceRenderState = {
  isPresent: boolean;
  onExitComplete: () => void;
};

export type PresenceRender = (state: PresenceRenderState) => React.ReactElement | undefined;

export type PresenceProps = {
  present: boolean;
  exitFallbackMs?: number;
  onExitComplete?: () => void;
  children?: PresenceRender;
  render?: PresenceRender;
};
