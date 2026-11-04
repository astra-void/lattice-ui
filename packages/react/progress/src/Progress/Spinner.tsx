import { type LoopMotionConfig, useLoopMotion } from "@lattice-ui/react-motion";
import { composeRefs, getPassthroughProps, getSlotChild, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import type { SpinnerProps } from "./types";

const OWN_PROPS = ["spinning", "speedDegPerSecond", "asChild", "children"] as const;

// See ProgressIndicator: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

// One full turn per cycle; a negative speed turns the other way.
function createSpinLoop(speedDegPerSecond: number): LoopMotionConfig {
  const direction = speedDegPerSecond < 0 ? -1 : 1;

  return {
    from: { Rotation: 0 },
    to: { Rotation: 360 * direction },
    duration: speedDegPerSecond === 0 ? 0 : 360 / math.abs(speedDegPerSecond),
  };
}

export function Spinner(props: SpinnerProps) {
  const spinning = props.spinning ?? true;
  const speedDegPerSecond = props.speedDegPerSecond ?? 180;

  // Rotation is driven by the motion runtime, so it follows the motion policy: with motion
  // disabled or the platform's reduced-motion setting on, the spinner rests unrotated.
  const spinLoop = React.useMemo(() => createSpinLoop(speedDegPerSecond), [speedDegPerSecond]);
  const motionRef = useLoopMotion<GuiObject>(spinning && speedDegPerSecond !== 0, spinLoop);

  const passthrough = getPassthroughProps<Frame>(props, OWN_PROPS);
  const ref = composeRefs<GuiObject>(passthrough.ref as never, motionRef);
  const behaviorProps = {
    Visible: spinning,
  };

  if (props.asChild) {
    const child = props.children;
    if (getSlotChild(child) === undefined) {
      error("[Spinner] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return (
      <Slot {...toSlotProps(passthrough)} {...behaviorProps} ref={ref as never}>
        {child}
      </Slot>
    );
  }

  return (
    <frame {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps} ref={ref}>
      {props.children}
    </frame>
  );
}
