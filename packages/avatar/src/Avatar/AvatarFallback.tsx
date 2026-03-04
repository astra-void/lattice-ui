import { React, Slot } from "@lattice-ui/core";
import { useAvatarContext } from "./context";
import { resolveAvatarFallbackVisible } from "./state";
import type { AvatarFallbackProps } from "./types";

export function AvatarFallback(props: AvatarFallbackProps) {
  const avatarContext = useAvatarContext();
  const visible = resolveAvatarFallbackVisible(avatarContext.status, avatarContext.delayElapsed);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[AvatarFallback] `asChild` requires a child element.");
    }

    return <Slot Visible={visible}>{child}</Slot>;
  }

  return (
    <textlabel
      BackgroundColor3={Color3.fromRGB(65, 72, 89)}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(40, 40)}
      Text="AB"
      TextColor3={Color3.fromRGB(235, 240, 248)}
      TextSize={14}
      Visible={visible}
    >
      <uicorner CornerRadius={new UDim(1, 0)} />
      {props.children}
    </textlabel>
  );
}
