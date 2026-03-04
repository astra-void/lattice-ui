import { React, Slot } from "@lattice-ui/core";
import { useScrollAreaContext } from "./context";
import type { ScrollAreaCornerProps } from "./types";

export function ScrollAreaCorner(props: ScrollAreaCornerProps) {
  const scrollAreaContext = useScrollAreaContext();
  const visible = scrollAreaContext.showHorizontalScrollbar && scrollAreaContext.showVerticalScrollbar;

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ScrollAreaCorner] `asChild` requires a child element.");
    }

    return <Slot Visible={visible}>{child}</Slot>;
  }

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(44, 52, 67)}
      BorderSizePixel={0}
      Position={UDim2.fromScale(1, 1)}
      Size={UDim2.fromOffset(8, 8)}
      Visible={visible}
    >
      {props.children}
    </frame>
  );
}
