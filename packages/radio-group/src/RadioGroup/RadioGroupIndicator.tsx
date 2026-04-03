import {
  getMotionTransitionExitFallbackMs,
  MOTION_PRESETS,
  type MotionTransition,
  mergeMotionTransition,
  React,
  Slot,
  useMotionTween,
} from "@lattice-ui/core";
import { Presence } from "@lattice-ui/layer";
import { useRadioGroupItemContext } from "./context";
import type { RadioGroupIndicatorProps } from "./types";

function buildRadioGroupIndicatorTransition(size: UDim2): MotionTransition {
  return {
    enter: {
      tweenInfo: MOTION_PRESETS.indicatorEnter,
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
      tweenInfo: MOTION_PRESETS.indicatorExit,
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

  useMotionTween(indicatorRef as React.MutableRefObject<Instance | undefined>, {
    active: props.visible,
    onExitComplete: props.onExitComplete,
    transition: props.transition,
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

  const transition = React.useMemo(() => {
    return mergeMotionTransition(buildRadioGroupIndicatorTransition(UDim2.fromOffset(10, 10)), props.transition);
  }, [props.transition]);

  if (forceMount) {
    return (
      <RadioGroupIndicatorImpl asChild={props.asChild} transition={transition} visible={visible}>
        {props.children}
      </RadioGroupIndicatorImpl>
    );
  }

  const exitFallbackMs = getMotionTransitionExitFallbackMs(transition);

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
