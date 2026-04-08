import { React, Slot } from "@lattice-ui/core";
import { Presence } from "@lattice-ui/layer";
import { createIndicatorRevealRecipe, type PresenceMotionConfig, usePresenceMotion } from "@lattice-ui/motion";
import { useRadioGroupItemContext } from "./context";
import type { RadioGroupIndicatorProps } from "./types";

function RadioGroupIndicatorImpl(props: {
  motionPresent: boolean;
  visible: boolean;
  transition?: PresenceMotionConfig;
  onExitComplete?: () => void;
  asChild?: boolean;
  children?: React.ReactNode;
}) {
  const motionRef = usePresenceMotion<Frame>(
    props.motionPresent,
    props.transition ?? createIndicatorRevealRecipe(UDim2.fromOffset(10, 10)),
    props.onExitComplete,
  );

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[RadioGroupIndicator] `asChild` requires a child element.");
    }

    return (
      <Slot Visible={props.visible} ref={motionRef}>
        {child}
      </Slot>
    );
  }

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(240, 244, 252)}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(10, 10)}
      Visible={props.visible}
      ref={motionRef}
    >
      {props.children}
    </frame>
  );
}

export function RadioGroupIndicator(props: RadioGroupIndicatorProps) {
  const radioGroupItemContext = useRadioGroupItemContext();
  const visible = radioGroupItemContext.checked;
  const forceMount = props.forceMount === true;

  const transition = React.useMemo(
    () => props.transition ?? createIndicatorRevealRecipe(UDim2.fromOffset(10, 10)),
    [props.transition],
  );

  if (forceMount) {
    return (
      <RadioGroupIndicatorImpl
        asChild={props.asChild}
        motionPresent={visible}
        transition={transition}
        visible={visible}
      >
        {props.children}
      </RadioGroupIndicatorImpl>
    );
  }

  return (
    <Presence
      present={visible}
      render={(state) => (
        <RadioGroupIndicatorImpl
          asChild={props.asChild}
          motionPresent={state.isPresent}
          onExitComplete={state.onExitComplete}
          transition={transition}
          visible={true}
        >
          {props.children}
        </RadioGroupIndicatorImpl>
      )}
    />
  );
}
