import { composeRefs, React } from "@lattice-ui/core";
import { createToggleResponseRecipe, useResponseMotion } from "@lattice-ui/motion";
import { useSwitchContext } from "./context";
import type { SwitchThumbProps } from "./types";

const UNCHECKED_THUMB_POSITION = UDim2.fromOffset(2, 2);
const CHECKED_THUMB_POSITION = new UDim2(1, -18, 0, 2);

type GuiPropBag = React.Attributes & Record<string, unknown>;

function toGuiPropBag(value: unknown): GuiPropBag {
  return typeIs(value, "table") ? (value as GuiPropBag) : {};
}

export function SwitchThumb(props: SwitchThumbProps) {
  const switchContext = useSwitchContext();
  const initialPosition = React.useRef(switchContext.checked ? CHECKED_THUMB_POSITION : UNCHECKED_THUMB_POSITION);

  const motionRef = useResponseMotion<Frame>(
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

    const childProps = toGuiPropBag((child as { props?: unknown }).props);
    const childSize = (childProps as { Size?: UDim2 }).Size ?? UDim2.fromOffset(16, 16);

    return (
      <frame
        BackgroundTransparency={1}
        BorderSizePixel={0}
        Position={initialPosition.current}
        Size={childSize}
        ref={motionRef}
      >
        {React.cloneElement(child as React.ReactElement<GuiPropBag>, {
          ...childProps,
          Position: UDim2.fromOffset(0, 0),
          ref: composeRefs((childProps as { ref?: React.Ref<Instance> }).ref),
        })}
      </frame>
    );
  }

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(240, 244, 252)}
      BorderSizePixel={0}
      Position={initialPosition.current}
      Size={UDim2.fromOffset(16, 16)}
      ref={motionRef as React.MutableRefObject<Frame>}
    >
      {child}
    </frame>
  );
}
