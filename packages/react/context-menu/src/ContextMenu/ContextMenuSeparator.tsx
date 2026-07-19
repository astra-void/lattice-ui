import { React, Slot } from "@lattice-ui/react-runtime";
import type { ContextMenuSeparatorProps } from "./types";

export function ContextMenuSeparator(props: ContextMenuSeparatorProps) {
  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ContextMenuSeparator] `asChild` requires a child element.");
    }

    return <Slot>{child}</Slot>;
  }

  return <frame BackgroundColor3={Color3.fromRGB(72, 79, 97)} BorderSizePixel={0} Size={UDim2.fromOffset(220, 1)} />;
}
