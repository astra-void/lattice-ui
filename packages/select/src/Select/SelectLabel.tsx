import { React, Slot } from "@lattice-ui/core";
import type { SelectLabelProps } from "./types";

export function SelectLabel(props: SelectLabelProps) {
  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[SelectLabel] `asChild` requires a child element.");
    }

    return <Slot>{child}</Slot>;
  }

  return (
    <textlabel
      BackgroundTransparency={1}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(220, 20)}
      Text="Label"
      TextColor3={Color3.fromRGB(168, 176, 191)}
      TextSize={13}
      TextXAlignment={Enum.TextXAlignment.Left}
    >
      {props.children}
    </textlabel>
  );
}
