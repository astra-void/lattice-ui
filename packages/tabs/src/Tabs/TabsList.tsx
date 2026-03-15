import { React, Slot } from "@lattice-ui/core";
import type { TabsListProps } from "./types";

export function TabsList(props: TabsListProps) {
  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[TabsList] `asChild` requires a child element.");
    }

    return <Slot>{child}</Slot>;
  }

  return <frame BackgroundTransparency={1} BorderSizePixel={0} Size={UDim2.fromOffset(0, 0)}>{props.children}</frame>;
}
