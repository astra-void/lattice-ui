import { React, Slot } from "@lattice-ui/core";
import type { MenuSeparatorProps } from "./types";

export function MenuSeparator(props: MenuSeparatorProps) {
  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[MenuSeparator] `asChild` requires a child element.");
    }

    return <Slot>{child}</Slot>;
  }

  return <frame BackgroundColor3={Color3.fromRGB(72, 79, 97)} BorderSizePixel={0} Size={UDim2.fromOffset(220, 1)} />;
}
