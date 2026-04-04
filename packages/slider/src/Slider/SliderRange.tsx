import { React, Slot } from "@lattice-ui/core";
import { type MotionTransition } from "@lattice-ui/motion";
import { useMotionTween } from "@lattice-ui/motion";
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

  const transition = React.useMemo<MotionTransition>(() => {
    return {
      enter: {
        tweenInfo: sliderContext.isDragging ? undefined : RANGE_TWEEN_INFO,
        to: {
          Position: rangePosition,
          Size: rangeSize,
        },
      },
    };
  }, [rangePosition, rangeSize, sliderContext.isDragging]);

  const rangeRef = React.useRef<GuiObject>();

  const setRangeRef = React.useCallback((instance: Instance | undefined) => {
    if (!instance || !instance.IsA("GuiObject")) {
      rangeRef.current = undefined;
      return;
    }
    rangeRef.current = instance;
  }, []);

  useMotionTween(rangeRef as React.MutableRefObject<Instance | undefined>, {
    active: true,
    transition,
  });

  const staticPosition = sliderContext.orientation === "horizontal" ? UDim2.fromScale(0, 0) : UDim2.fromScale(0, 1);
  const staticSize = sliderContext.orientation === "horizontal" ? UDim2.fromScale(0, 1) : UDim2.fromScale(1, 0);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[SliderRange] `asChild` requires a child element.");
    }

    return (
      <Slot Name="SliderRange" Position={staticPosition} Size={staticSize} ref={setRangeRef}>
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
      ref={setRangeRef}
    >
      {props.children}
    </frame>
  );
}
