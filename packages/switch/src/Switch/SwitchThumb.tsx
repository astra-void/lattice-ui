import { composeRefs, React } from "@lattice-ui/core";
import { createToggleResponseRecipe, useResponseMotion } from "@lattice-ui/motion";
import { useSwitchContext } from "./context";
import type { SwitchThumbProps } from "./types";

const THUMB_INSET = 2;
const DEFAULT_THUMB_SIZE = UDim2.fromOffset(16, 16);
const UNCHECKED_THUMB_POSITION = UDim2.fromOffset(THUMB_INSET, THUMB_INSET);

type GuiPropBag = React.Attributes & Record<string, unknown>;

function toGuiPropBag(value: unknown): GuiPropBag {
  return typeIs(value, "table") ? (value as GuiPropBag) : {};
}

function getCheckedThumbPosition(size: UDim2) {
  return new UDim2(1 - size.X.Scale, -(size.X.Offset + THUMB_INSET), 0, THUMB_INSET);
}

export function SwitchThumb(props: SwitchThumbProps) {
  const switchContext = useSwitchContext();
  const child = props.children;
  const childProps =
    props.asChild && React.isValidElement(child) ? toGuiPropBag((child as { props?: unknown }).props) : undefined;
  const thumbSize = (childProps as { Size?: UDim2 } | undefined)?.Size ?? DEFAULT_THUMB_SIZE;

  const motionRef = useResponseMotion<Frame>(
    switchContext.checked,
    {
      active: { Position: getCheckedThumbPosition(thumbSize) },
      inactive: { Position: UNCHECKED_THUMB_POSITION },
    },
    createToggleResponseRecipe(0.05),
  );

  if (props.asChild) {
    if (!React.isValidElement(child)) {
      error("[SwitchThumb] `asChild` requires a child element.");
    }

    const resolvedChildProps = childProps ?? {};

    return (
      <frame BackgroundTransparency={1} BorderSizePixel={0} Size={thumbSize} ref={motionRef}>
        {React.cloneElement(child as React.ReactElement<GuiPropBag>, {
          ...resolvedChildProps,
          Position: UDim2.fromOffset(0, 0),
          ref: composeRefs((resolvedChildProps as { ref?: React.Ref<Instance> }).ref),
        })}
      </frame>
    );
  }

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(240, 244, 252)}
      BorderSizePixel={0}
      Size={DEFAULT_THUMB_SIZE}
      ref={motionRef as React.MutableRefObject<Frame>}
    >
      {child}
    </frame>
  );
}
