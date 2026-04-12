import { React, Slot } from "@lattice-ui/core";
import { Presence } from "@lattice-ui/layer";
import {
  createIndicatorRevealRecipe,
  type PresenceMotionConfig,
  usePresenceMotionController,
} from "@lattice-ui/motion";
import { useRadioGroupItemContext } from "./context";
import type { RadioGroupIndicatorProps } from "./types";

function RadioGroupIndicatorImpl(props: {
  present: boolean;
  forceMount?: boolean;
  transition?: PresenceMotionConfig;
  onExitComplete?: () => void;
  asChild?: boolean;
  children?: React.ReactNode;
}) {
  const defaultTransition = React.useMemo(() => createIndicatorRevealRecipe(UDim2.fromOffset(10, 10)), []);
  const config = props.transition ?? defaultTransition;

  const motion = usePresenceMotionController<Frame>({
    present: props.present,
    forceMount: props.forceMount,
    config,
    onExitComplete: props.onExitComplete,
  });

  const mounted = motion.mounted;
  const visible = mounted && (motion.present || motion.phase !== "exited");

  if (!mounted) {
    return undefined;
  }

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[RadioGroupIndicator] `asChild` requires a child element.");
    }

    return (
      <Slot Visible={visible} ref={motion.ref}>
        {child}
      </Slot>
    );
  }

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(240, 244, 252)}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(10, 10)}
      Visible={visible}
      ref={motion.ref}
    >
      {props.children}
    </frame>
  );
}

export function RadioGroupIndicator(props: RadioGroupIndicatorProps) {
  const radioGroupItemContext = useRadioGroupItemContext();
  const visible = radioGroupItemContext.checked;
  const forceMount = props.forceMount === true;

  if (forceMount) {
    return (
      <RadioGroupIndicatorImpl
        asChild={props.asChild}
        forceMount={true}
        present={visible}
        transition={props.transition}
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
          onExitComplete={state.onExitComplete}
          present={state.isPresent}
          transition={props.transition}
        >
          {props.children}
        </RadioGroupIndicatorImpl>
      )}
    />
  );
}
