import { React, Slot } from "@lattice-ui/core";
import type { MenuLabelProps } from "./types";

export function MenuLabel(props: MenuLabelProps) {
  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[MenuLabel] `asChild` requires a child element.");
    }

    return <Slot>{child}</Slot>;
  }

  return (
    <textlabel
      BackgroundTransparency={1}
      Size={UDim2.fromOffset(220, 24)}
      Text="Label"
      TextColor3={Color3.fromRGB(162, 173, 191)}
      TextSize={14}
      TextXAlignment={Enum.TextXAlignment.Left}
    >
      <uipadding PaddingLeft={new UDim(0, 10)} />
      {props.children}
    </textlabel>
  );
}
