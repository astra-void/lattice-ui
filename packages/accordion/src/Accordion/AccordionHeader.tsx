import { React, Slot } from "@lattice-ui/core";
import type { AccordionHeaderProps } from "./types";

export function AccordionHeader(props: AccordionHeaderProps) {
  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[AccordionHeader] `asChild` requires a child element.");
    }

    return <Slot>{child}</Slot>;
  }

  return (
    <frame BackgroundTransparency={1} BorderSizePixel={0} Size={UDim2.fromOffset(260, 34)}>
      {props.children}
    </frame>
  );
}
