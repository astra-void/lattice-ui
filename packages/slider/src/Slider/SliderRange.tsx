import { React, Slot } from "@lattice-ui/core";
import type { MotionConfig } from "@lattice-ui/motion";
import { useStateMotion } from "@lattice-ui/motion";
import { useSliderContext } from "./context";
import { valueToPercent } from "./internals/math";
import type { SliderRangeProps } from "./types";

const RANGE_TWEEN_INFO = new TweenInfo(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);

export function SliderRange(props: SliderRangeProps) {
  const sliderContext = useSliderContext();
  const percent = valueToPercent(sliderContext.value, sliderContext.min, sliderContext.max);

  const rangeSize =
    sliderContext.orientation === "horizontal" ? UDim2.fromScale(percent, 1) : UDim2.fromScale(1, percent);
  const rangePosition =
    sliderContext.orientation === "horizontal" ? UDim2.fromScale(0, 0) : UDim2.fromScale(0, 1 - percent);

  const transition = React.useMemo(() => {
    return {
      entering: {
        tweenInfo: sliderContext.isDragging ? undefined : RANGE_TWEEN_INFO,
        goals: {
          Position: rangePosition,
          Size: rangeSize,
        },
      },
      entered: {
        tweenInfo: sliderContext.isDragging ? undefined : RANGE_TWEEN_INFO,
        goals: {
          Position: rangePosition,
          Size: rangeSize,
        },
      },
    } satisfies MotionConfig;
  }, [rangePosition, rangeSize, sliderContext.isDragging]);
  const motionRef = useStateMotion<Frame>(true, transition, false);

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
