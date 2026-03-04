import { React, Slot } from "@lattice-ui/core";
import type { ComboboxGroupProps } from "./types";

export function ComboboxGroup(props: ComboboxGroupProps) {
  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ComboboxGroup] `asChild` requires a child element.");
    }

    return <Slot>{child}</Slot>;
  }

  return (
    <frame BackgroundTransparency={1} BorderSizePixel={0} Size={UDim2.fromOffset(220, 108)}>
      {props.children}
    </frame>
  );
}
