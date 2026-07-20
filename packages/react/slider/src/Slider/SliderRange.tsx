import { createProgressResponseRecipe, motionDrag, useResponseMotion } from "@lattice-ui/react-motion";
import { composeRefs, getPassthroughProps, getSlotChild, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import { useSliderContext } from "./context";
import { valueToPercent } from "./internals/math";
import type { SliderRangeProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// See SliderTrack: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

// The consumer's element fills the motion-owned host instead of re-applying the value ratio itself.
const CHILD_FILL_PROPS = {
  Position: UDim2.fromScale(0, 0),
  Size: UDim2.fromScale(1, 1),
};

export function SliderRange(props: SliderRangeProps) {
  const sliderContext = useSliderContext();
  const percent = valueToPercent(sliderContext.value, sliderContext.min, sliderContext.max);

  const rangeSize =
    sliderContext.orientation === "horizontal" ? UDim2.fromScale(percent, 1) : UDim2.fromScale(1, percent);
  const rangePosition =
    sliderContext.orientation === "horizontal" ? UDim2.fromScale(0, 0) : UDim2.fromScale(0, 1 - percent);

  // Position/Size are the value mapping, not decoration: motion owns them on this instance.
  const motionRef = useResponseMotion<Frame>(
    true,
    {
      active: { Position: rangePosition, Size: rangeSize },
      inactive: { Position: rangePosition, Size: rangeSize },
    },
    createProgressResponseRecipe(sliderContext.isDragging ? motionDrag.active : motionDrag.idle),
  );

  const passthrough = getPassthroughProps<Frame>(props, OWN_PROPS);

  if (props.asChild) {
    const child = props.children;
    if (getSlotChild(child) === undefined) {
      error("[SliderRange] `asChild` requires a child element.");
    }

    // The wrapper is ours (motion owns its geometry), so it keeps the neutral defaults; the
    // consumer's element only receives passthrough and fill geometry.
    return (
      <frame {...NEUTRAL_PROPS} ref={motionRef}>
        <Slot {...toSlotProps(passthrough)} {...CHILD_FILL_PROPS}>
          {child}
        </Slot>
      </frame>
    );
  }

  const ref = composeRefs<Frame>(passthrough.ref as never, motionRef);

  return (
    <frame {...NEUTRAL_PROPS} {...passthrough} ref={ref}>
      {props.children}
    </frame>
  );
}
