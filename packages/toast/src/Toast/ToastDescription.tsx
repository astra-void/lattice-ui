import { React, Slot } from "@lattice-ui/core";
import type { ToastDescriptionProps } from "./types";

export function ToastDescription(props: ToastDescriptionProps) {
  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ToastDescription] `asChild` requires a child element.");
    }

    return <Slot>{child}</Slot>;
  }

  return (
    <textlabel
      BackgroundTransparency={1}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(300, 18)}
      Text="Description"
      TextColor3={Color3.fromRGB(172, 180, 196)}
      TextSize={13}
      TextXAlignment={Enum.TextXAlignment.Left}
    />
  );
}
