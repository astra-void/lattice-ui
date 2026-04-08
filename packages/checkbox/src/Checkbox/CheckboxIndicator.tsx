import { React, Slot } from "@lattice-ui/core";
import { Presence } from "@lattice-ui/layer";
import { createIndicatorRevealRecipe, type PresenceMotionConfig, usePresenceMotion } from "@lattice-ui/motion";
import { useCheckboxContext } from "./context";
import type { CheckboxIndicatorProps } from "./types";

function CheckboxIndicatorImpl(props: {
  motionPresent: boolean;
  visible: boolean;
  transition?: PresenceMotionConfig;
  onExitComplete?: () => void;
  asChild?: boolean;
  children?: React.ReactNode;
}) {
  const motionRef = usePresenceMotion<Frame>(
    props.motionPresent,
    props.transition ?? createIndicatorRevealRecipe(UDim2.fromOffset(12, 12)),
    props.onExitComplete,
  );

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[CheckboxIndicator] `asChild` requires a child element.");
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
      Size={UDim2.fromOffset(12, 12)}
      Visible={props.visible}
      ref={motionRef}
    >
      {props.children}
    </frame>
  );
}

export function CheckboxIndicator(props: CheckboxIndicatorProps) {
  const checkboxContext = useCheckboxContext();
  const visible = checkboxContext.checked !== false;
  const forceMount = props.forceMount === true;

  const transition = React.useMemo(
    () => props.transition ?? createIndicatorRevealRecipe(UDim2.fromOffset(12, 12)),
    [props.transition],
  );

  if (forceMount) {
    return (
      <CheckboxIndicatorImpl asChild={props.asChild} motionPresent={visible} transition={transition} visible={visible}>
        {props.children}
      </CheckboxIndicatorImpl>
    );
  }

  return (
    <Presence
      present={visible}
      render={(state) => (
        <CheckboxIndicatorImpl
          asChild={props.asChild}
          motionPresent={state.isPresent}
          onExitComplete={state.onExitComplete}
          transition={transition}
          visible={true}
        >
          {props.children}
        </CheckboxIndicatorImpl>
      )}
    />
  );
}
