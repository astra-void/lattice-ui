import type { PassthroughProps } from "@lattice-ui/react-runtime";
import type React from "@rbxts/react";
import type { AvatarStatus } from "./state";

export type AvatarContextValue = {
  src?: string;
  status: AvatarStatus;
  setStatus: (status: AvatarStatus) => void;
  delayElapsed: boolean;
  /** `Avatar.Image` reports its own `src` so the root arms `delayMs` for it too. */
  setImageSrc: (src: string | undefined) => void;
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
} & PassthroughProps<ImageLabel | ImageButton>;

export type AvatarFallbackProps = {
  asChild?: boolean;
  children?: React.ReactElement;
} & PassthroughProps<TextLabel>;
