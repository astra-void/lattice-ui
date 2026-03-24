import {
  getMotionTransitionExitFallbackMs,
  type MotionTransition,
  mergeMotionTransition,
  React,
  Slot,
  useMotionTween,
} from "@lattice-ui/core";
import { Presence } from "@lattice-ui/layer";
import { useRadioGroupItemContext } from "./context";
import type { RadioGroupIndicatorProps } from "./types";

const INDICATOR_TWEEN_INFO = new TweenInfo(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);
const INDICATOR_EXIT_TWEEN_INFO = new TweenInfo(0.08, Enum.EasingStyle.Quad, Enum.EasingDirection.In);

function buildRadioGroupIndicatorTransition(size: UDim2): MotionTransition {
  return {
    enter: {
      tweenInfo: INDICATOR_TWEEN_INFO,
      from: {
        Size: UDim2.fromOffset(0, 0),
        BackgroundTransparency: 1,
      },
      to: {
        Size: size,
        BackgroundTransparency: 0,
      },
    },
    exit: {
      tweenInfo: INDICATOR_EXIT_TWEEN_INFO,
      to: {
        Size: UDim2.fromOffset(0, 0),
        BackgroundTransparency: 1,
      },
    },
  };
}

function RadioGroupIndicatorImpl(props: {
  visible: boolean;
  transition?: MotionTransition | false;
  onExitComplete?: () => void;
  asChild?: boolean;
  children?: React.ReactNode;
}) {
  const indicatorRef = React.useRef<Frame>();
  const motionTransition = React.useMemo(() => {
    return mergeMotionTransition(buildRadioGroupIndicatorTransition(UDim2.fromOffset(10, 10)), props.transition);
  }, [props.transition]);

  useMotionTween(indicatorRef as React.MutableRefObject<Instance | undefined>, {
    active: props.visible,
    onExitComplete: props.onExitComplete,
    transition: motionTransition,
  });

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[RadioGroupIndicator] `asChild` requires a child element.");
    }

    return (
      <Slot Visible={props.visible} ref={indicatorRef}>
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
      ref={indicatorRef}
    >
      {props.children}
    </frame>
  );
}

export function RadioGroupIndicator(props: RadioGroupIndicatorProps) {
  const radioGroupItemContext = useRadioGroupItemContext();
  const visible = radioGroupItemContext.checked;
  const forceMount = props.forceMount === true;

  if (!visible && !forceMount) {
    return undefined;
  }

  const transition = props.transition;
  const exitFallbackMs = getMotionTransitionExitFallbackMs(transition);

  if (forceMount) {
    return (
      <RadioGroupIndicatorImpl asChild={props.asChild} transition={transition} visible={visible}>
        {props.children}
      </RadioGroupIndicatorImpl>
    );
  }

  return (
    <Presence
      exitFallbackMs={exitFallbackMs}
      present={visible}
      render={(state) => (
        <RadioGroupIndicatorImpl
          asChild={props.asChild}
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
