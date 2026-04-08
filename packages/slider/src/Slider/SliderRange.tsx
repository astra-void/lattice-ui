import { React, Slot } from "@lattice-ui/core";
import { createProgressResponseRecipe, useResponseMotion } from "@lattice-ui/motion";
import { useSliderContext } from "./context";
import { valueToPercent } from "./internals/math";
import type { SliderRangeProps } from "./types";

export function SliderRange(props: SliderRangeProps) {
  const sliderContext = useSliderContext();
  const percent = valueToPercent(sliderContext.value, sliderContext.min, sliderContext.max);

  const rangeSize =
    sliderContext.orientation === "horizontal" ? UDim2.fromScale(percent, 1) : UDim2.fromScale(1, percent);
  const rangePosition =
    sliderContext.orientation === "horizontal" ? UDim2.fromScale(0, 0) : UDim2.fromScale(0, 1 - percent);

  const motionRef = useResponseMotion<Frame>(
    true,
    {
      active: { Position: rangePosition, Size: rangeSize },
      inactive: { Position: rangePosition, Size: rangeSize },
    },
    createProgressResponseRecipe(sliderContext.isDragging ? 0.05 : 0.12),
  );

  const staticPosition = sliderContext.orientation === "horizontal" ? UDim2.fromScale(0, 0) : UDim2.fromScale(0, 1);
  const staticSize = sliderContext.orientation === "horizontal" ? UDim2.fromScale(0, 1) : UDim2.fromScale(1, 0);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[SliderRange] `asChild` requires a child element.");
    }

    return (
      <Slot Name="SliderRange" Position={staticPosition} Size={staticSize} ref={motionRef}>
        {child}
      </Slot>
    );
  }

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(86, 142, 255)}
      BorderSizePixel={0}
      Position={staticPosition}
      Size={staticSize}
      ref={motionRef}
    >
      {props.children}
    </frame>
  );
}
