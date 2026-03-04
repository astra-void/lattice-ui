import { React, Slot } from "@lattice-ui/core";
import { useScrollAreaContext } from "./context";
import { resolveThumbOffset, resolveThumbSize } from "./scrollMath";
import type { ScrollAreaThumbProps } from "./types";

export function ScrollAreaThumb(props: ScrollAreaThumbProps) {
  const scrollAreaContext = useScrollAreaContext();
  const vertical = props.orientation === "vertical";

  const axisMetrics = vertical ? scrollAreaContext.vertical : scrollAreaContext.horizontal;
  const trackSize = math.max(1, axisMetrics.viewportSize);
  const thumbSize = resolveThumbSize(axisMetrics.viewportSize, axisMetrics.contentSize, trackSize);
  const thumbOffset = resolveThumbOffset(
    axisMetrics.scrollPosition,
    axisMetrics.viewportSize,
    axisMetrics.contentSize,
    trackSize,
    thumbSize,
  );

  const sizeScale = trackSize > 0 ? thumbSize / trackSize : 1;
  const offsetScale = trackSize > 0 ? thumbOffset / trackSize : 0;

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ScrollAreaThumb] `asChild` requires a child element.");
    }

    return (
      <Slot
        Position={vertical ? UDim2.fromScale(0, offsetScale) : UDim2.fromScale(offsetScale, 0)}
        Size={vertical ? UDim2.fromScale(1, sizeScale) : UDim2.fromScale(sizeScale, 1)}
      >
        {child}
      </Slot>
    );
  }

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(118, 128, 149)}
      BorderSizePixel={0}
      Position={vertical ? UDim2.fromScale(0, offsetScale) : UDim2.fromScale(offsetScale, 0)}
      Size={vertical ? UDim2.fromScale(1, sizeScale) : UDim2.fromScale(sizeScale, 1)}
    >
      <uicorner CornerRadius={new UDim(1, 0)} />
      {props.children}
    </frame>
  );
}
