import { React, Slot } from "@lattice-ui/core";
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

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[SliderRange] `asChild` requires a child element.");
    }

    return (
      <Slot Name="SliderRange" Position={rangePosition} Size={rangeSize}>
        {child}
      </Slot>
    );
  }

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(86, 142, 255)}
      BorderSizePixel={0}
      Position={rangePosition}
      Size={rangeSize}
    >
      {props.children}
    </frame>
  );
}
