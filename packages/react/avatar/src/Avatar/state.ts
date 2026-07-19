export type AvatarStatus = "idle" | "loading" | "loaded" | "error";

export function resolveAvatarFallbackVisible(status: AvatarStatus, delayElapsed: boolean) {
  if (status === "loaded") {
    return false;
  }

  if (status === "error") {
    return true;
  }

  return delayElapsed;
}
