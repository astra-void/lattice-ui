import { type PresenceMotionConfig, usePresenceMotionController } from "@lattice-ui/react-motion";
import { composeRefs, getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import type { ToastRootProps } from "./types";

const OWN_PROPS = ["transition", "asChild", "visible", "onExitComplete", "children"] as const;

// Roblox instance defaults are themselves a look: a bare `canvasgroup` renders an opaque grey box.
// Neutralize only that, and leave every real appearance decision (colors, size, corners, padding)
// to the consumer. Passthrough props are spread after these, so they stay overridable.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

// An unstyled toast has nothing to animate, so there is no default recipe. Presence timing is still
// owned here; consumers opt into motion with `transition`.
const NO_MOTION: PresenceMotionConfig = {};

export function ToastRoot(props: ToastRootProps) {
  const visible = props.visible ?? true;
  const transition = props.transition ?? NO_MOTION;

  const motion = usePresenceMotionController<CanvasGroup>({
    present: visible,
    config: transition,
    onExitComplete: props.onExitComplete,
  });

  // Stay visible through the exiting phase so the exit animation can play;
  // the instance only hides once the presence controller reports "exited".
  const motionVisible = motion.mounted && motion.phase !== "exited";

  const passthrough = getPassthroughProps<CanvasGroup>(props, OWN_PROPS);
  const behaviorProps = {
    Visible: motionVisible,
    ref: composeRefs<CanvasGroup>(passthrough.ref as never, motion.ref),
  };

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[ToastRoot] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return (
      <Slot {...toSlotProps(passthrough)} Visible={motionVisible} ref={behaviorProps.ref as never}>
        {child}
      </Slot>
    );
  }

  return (
    <canvasgroup {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps}>
      {props.children}
    </canvasgroup>
  );
}
