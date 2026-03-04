import { React, Slot } from "@lattice-ui/core";
import type { ToastTitleProps } from "./types";

export function ToastTitle(props: ToastTitleProps) {
  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ToastTitle] `asChild` requires a child element.");
    }

    return <Slot>{child}</Slot>;
  }

  return (
    <textlabel
      BackgroundTransparency={1}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(300, 20)}
      Text="Toast"
      TextColor3={Color3.fromRGB(235, 240, 248)}
      TextSize={14}
      TextXAlignment={Enum.TextXAlignment.Left}
    />
  );
}
