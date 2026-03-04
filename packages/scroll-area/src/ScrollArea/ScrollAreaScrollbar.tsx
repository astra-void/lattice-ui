import { React, Slot } from "@lattice-ui/core";
import { useScrollAreaContext } from "./context";
import type { ScrollAreaScrollbarProps } from "./types";

export function ScrollAreaScrollbar(props: ScrollAreaScrollbarProps) {
  const scrollAreaContext = useScrollAreaContext();

  const vertical = props.orientation === "vertical";
  const visible = vertical ? scrollAreaContext.showVerticalScrollbar : scrollAreaContext.showHorizontalScrollbar;

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ScrollAreaScrollbar] `asChild` requires a child element.");
    }

    return <Slot Visible={visible}>{child}</Slot>;
  }

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(44, 52, 67)}
      BorderSizePixel={0}
      Position={vertical ? UDim2.fromScale(1, 0) : UDim2.fromScale(0, 1)}
      Size={vertical ? UDim2.fromOffset(8, 160) : UDim2.fromOffset(260, 8)}
      Visible={visible}
    >
      {props.children}
    </frame>
  );
}
