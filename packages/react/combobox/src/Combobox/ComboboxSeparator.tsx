import { React, Slot } from "@lattice-ui/react-runtime";
import type { ComboboxSeparatorProps } from "./types";

export function ComboboxSeparator(props: ComboboxSeparatorProps) {
  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ComboboxSeparator] `asChild` requires a child element.");
    }

    return <Slot>{child}</Slot>;
  }

  return (
    <frame BackgroundColor3={Color3.fromRGB(78, 86, 104)} BorderSizePixel={0} Size={UDim2.fromOffset(220, 1)}>
      {props.children}
    </frame>
  );
}
