import type React from "@rbxts/react";
import type { AvatarStatus } from "./state";

export type AvatarContextValue = {
  src?: string;
  status: AvatarStatus;
  setStatus: (status: AvatarStatus) => void;
  delayElapsed: boolean;
};

export type AvatarProps = {
  src?: string;
  delayMs?: number;
  children?: React.ReactNode;
};

export type AvatarImageProps = {
  asChild?: boolean;
  src?: string;
  children?: React.ReactElement;
};

export type AvatarFallbackProps = {
  asChild?: boolean;
  children?: React.ReactElement;
};
