import { AvatarFallback } from "./Avatar/AvatarFallback";
import { AvatarImage } from "./Avatar/AvatarImage";
import { AvatarRoot } from "./Avatar/AvatarRoot";

export const Avatar = {
  Root: AvatarRoot,
  Image: AvatarImage,
  Fallback: AvatarFallback,
} as const;

export { resolveAvatarFallbackVisible } from "./Avatar/state";
export type { AvatarStatus } from "./Avatar/state";
export type { AvatarContextValue, AvatarFallbackProps, AvatarImageProps, AvatarProps } from "./Avatar/types";
