import { composeRefs, React } from "@lattice-ui/core";
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

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[SliderRange] `asChild` requires a child element.");
    }

    const childProps = (child as { props?: Record<string, unknown> }).props ?? {};

    return (
      <frame BackgroundTransparency={1} BorderSizePixel={0} ref={motionRef}>
        {React.cloneElement(child, {
          ...childProps,
          Position: UDim2.fromScale(0, 0),
          Size: UDim2.fromScale(1, 1),
          ref: composeRefs((childProps as { ref?: React.Ref<Instance> }).ref),
        })}
      </frame>
    );
  }

  return (
    <frame BackgroundColor3={Color3.fromRGB(86, 142, 255)} BorderSizePixel={0} ref={motionRef}>
      {props.children}
    </frame>
  );
}
