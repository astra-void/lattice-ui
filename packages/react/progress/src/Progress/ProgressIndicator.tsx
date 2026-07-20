import { createProgressResponseRecipe, useResponseMotion } from "@lattice-ui/react-motion";
import { composeRefs, getPassthroughProps, getSlotChild, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import { useProgressContext } from "./context";
import type { ProgressIndicatorProps } from "./types";

const OWN_PROPS = ["transition", "asChild", "children"] as const;

// Roblox instance defaults are themselves a look. Neutralize only those and leave every appearance
// decision to the consumer; passthrough props are spread after these, so they stay overridable.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

// Geometry, not decoration: the fill ratio is expressed as this element's width, motion animates
// `Size` on the same instance, and clipping keeps oversized content inside the fill. Spread after
// the passthrough props so a consumer cannot accidentally overwrite the value mapping.
const FILL_PROPS = {
  ClipsDescendants: true,
  Position: UDim2.fromScale(0, 0),
  Size: UDim2.fromScale(0, 1),
};

// The consumer's element fills the motion-owned host instead of re-applying the ratio itself.
const CHILD_FILL_PROPS = {
  Position: UDim2.fromScale(0, 0),
  Size: UDim2.fromScale(1, 1),
};

export function ProgressIndicator(props: ProgressIndicatorProps) {
  const progressContext = useProgressContext();

  const widthScale = progressContext.indeterminate ? 0.35 : progressContext.ratio;

  const motionRef = useResponseMotion<Frame>(
    true,
    {
      active: { Size: UDim2.fromScale(widthScale, 1) },
      inactive: { Size: UDim2.fromScale(widthScale, 1) },
    },
    props.transition ?? createProgressResponseRecipe(),
  );

  const passthrough = getPassthroughProps<Frame>(props, OWN_PROPS);

  if (props.asChild) {
    const child = props.children;
    if (getSlotChild(child) === undefined) {
      error("[ProgressIndicator] `asChild` requires a child element.");
    }

    // The wrapper is ours (motion owns its geometry), so it keeps the neutral defaults; the
    // consumer's element only receives passthrough and fill geometry.
    return (
      <frame {...NEUTRAL_PROPS} {...FILL_PROPS} ref={motionRef}>
        <Slot {...toSlotProps(passthrough)} {...CHILD_FILL_PROPS}>
          {child}
        </Slot>
      </frame>
    );
  }

  const ref = composeRefs<Frame>(passthrough.ref as never, motionRef);

  return (
    <frame {...NEUTRAL_PROPS} {...passthrough} {...FILL_PROPS} ref={ref}>
      {props.children}
    </frame>
  );
}
