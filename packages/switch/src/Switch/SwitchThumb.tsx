import { React, Slot } from "@lattice-ui/core";
import { createToggleResponseRecipe, useResponseMotion } from "@lattice-ui/motion";
import { useSwitchContext } from "./context";
import type { SwitchThumbProps } from "./types";

const UNCHECKED_THUMB_POSITION = UDim2.fromOffset(2, 2);
const CHECKED_THUMB_POSITION = new UDim2(1, -18, 0, 2);

export function SwitchThumb(props: SwitchThumbProps) {
  const switchContext = useSwitchContext();

  const motionRef = useResponseMotion<GuiObject>(
    switchContext.checked,
    {
      active: { Position: CHECKED_THUMB_POSITION },
      inactive: { Position: UNCHECKED_THUMB_POSITION },
    },
    createToggleResponseRecipe(),
  );

  const child = props.children;

  if (props.asChild) {
    if (!React.isValidElement(child)) {
      error("[SwitchThumb] `asChild` requires a child element.");
    }

    return <Slot ref={motionRef}>{child}</Slot>;
  }

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(240, 244, 252)}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(16, 16)}
      ref={motionRef as React.MutableRefObject<Frame>}
    >
      {child}
    </frame>
  );
}
