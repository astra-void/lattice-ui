import { React, Slot } from "@lattice-ui/core";
import { type MotionTransition, mergeMotionTransition, useMotionTween } from "@lattice-ui/motion";
import { useSwitchContext } from "./context";
import type { SwitchThumbProps } from "./types";

const THUMB_TWEEN_INFO = new TweenInfo(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);
const THUMB_EXIT_TWEEN_INFO = new TweenInfo(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.In);
const UNCHECKED_THUMB_POSITION = UDim2.fromOffset(2, 2);
const CHECKED_THUMB_POSITION = new UDim2(1, -18, 0, 2);

function buildSwitchThumbTransition() {
  return {
    enter: {
      tweenInfo: THUMB_TWEEN_INFO,
      to: {
        Position: CHECKED_THUMB_POSITION,
      },
    },
    exit: {
      tweenInfo: THUMB_EXIT_TWEEN_INFO,
      to: {
        Position: UNCHECKED_THUMB_POSITION,
      },
    },
  } satisfies MotionTransition;
}

export function SwitchThumb(props: SwitchThumbProps) {
  const switchContext = useSwitchContext();
  const thumbRef = React.useRef<Frame>();
  const [motionReady, setMotionReady] = React.useState(false);

  React.useEffect(() => {
    setMotionReady(true);
  }, []);

  const motionTransition = React.useMemo(() => {
    return mergeMotionTransition(buildSwitchThumbTransition(), props.transition);
  }, [props.transition]);

  useMotionTween(thumbRef as React.MutableRefObject<Instance | undefined>, {
    active: switchContext.checked,
    transition: motionReady ? motionTransition : false,
  });

  const child = props.children;
  const position = switchContext.checked ? CHECKED_THUMB_POSITION : UNCHECKED_THUMB_POSITION;

  if (props.asChild) {
    if (!React.isValidElement(child)) {
      error("[SwitchThumb] `asChild` requires a child element.");
    }

    return (
      <Slot
        Position={motionReady ? undefined : position}
        ref={thumbRef as React.MutableRefObject<Instance | undefined>}
      >
        {child}
      </Slot>
    );
  }

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(240, 244, 252)}
      BorderSizePixel={0}
      Position={motionReady ? undefined : position}
      Size={UDim2.fromOffset(16, 16)}
      ref={thumbRef}
    >
      {child}
    </frame>
  );
}
