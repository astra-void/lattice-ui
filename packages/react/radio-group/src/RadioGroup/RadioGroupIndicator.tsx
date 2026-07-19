import { Presence } from "@lattice-ui/react-layer";
import { type PresenceMotionConfig, usePresenceMotionController } from "@lattice-ui/react-motion";
import { composeRefs, getPassthroughProps, React, Slot } from "@lattice-ui/react-runtime";
import { useRadioGroupItemContext } from "./context";
import type { RadioGroupIndicatorProps } from "./types";

const OWN_PROPS = ["transition", "forceMount", "asChild", "children"] as const;

// See RadioGroupItem: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

// An unstyled indicator has nothing to animate, so there is no default recipe. Presence timing is
// still owned here; consumers opt into motion with `transition`.
const NO_MOTION: PresenceMotionConfig = {};

function RadioGroupIndicatorImpl(props: {
  present: boolean;
  forceMount?: boolean;
  transition?: PresenceMotionConfig;
  onExitComplete?: () => void;
  asChild?: boolean;
  children?: React.ReactNode;
  passthrough: Record<string, unknown>;
}) {
  const config = props.transition ?? NO_MOTION;

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

  const passthrough = props.passthrough;
  const ref = composeRefs<Frame>(passthrough.ref as never, motion.ref);

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[RadioGroupIndicator] `asChild` requires a child element.");
    }

    return (
      <Slot {...passthrough} Visible={visible} ref={ref as never}>
        {child}
      </Slot>
    );
  }

  return (
    <frame {...NEUTRAL_PROPS} {...passthrough} Visible={visible} ref={ref}>
      {props.children}
    </frame>
  );
}

export function RadioGroupIndicator(props: RadioGroupIndicatorProps) {
  const radioGroupItemContext = useRadioGroupItemContext();
  const visible = radioGroupItemContext.checked;
  const forceMount = props.forceMount === true;
  const passthrough = getPassthroughProps(props, OWN_PROPS);

  if (forceMount) {
    return (
      <RadioGroupIndicatorImpl
        asChild={props.asChild}
        forceMount={true}
        passthrough={passthrough}
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
          passthrough={passthrough}
          present={state.isPresent}
          transition={props.transition}
        >
          {props.children}
        </RadioGroupIndicatorImpl>
      )}
    />
  );
}
