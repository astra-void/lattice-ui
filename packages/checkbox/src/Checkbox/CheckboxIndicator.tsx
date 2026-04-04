import { React, Slot } from "@lattice-ui/core";
import { MOTION_PRESETS, type MotionTransition } from "@lattice-ui/motion";
import { getMotionTransitionExitFallbackMs, mergeMotionTransition, useMotionTween } from "@lattice-ui/motion";
import { Presence } from "@lattice-ui/layer";
import { useCheckboxContext } from "./context";
import type { CheckboxIndicatorProps } from "./types";

function buildCheckboxIndicatorTransition(size: UDim2): MotionTransition {
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

function CheckboxIndicatorImpl(props: {
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
      error("[CheckboxIndicator] `asChild` requires a child element.");
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
      Size={UDim2.fromOffset(12, 12)}
      Visible={props.visible}
      ref={indicatorRef}
    >
      {props.children}
    </frame>
  );
}

export function CheckboxIndicator(props: CheckboxIndicatorProps) {
  const checkboxContext = useCheckboxContext();
  const visible = checkboxContext.checked !== false;
  const forceMount = props.forceMount === true;

  const transition = React.useMemo(() => {
    return mergeMotionTransition(buildCheckboxIndicatorTransition(UDim2.fromOffset(12, 12)), props.transition);
  }, [props.transition]);

  if (forceMount) {
    return (
      <CheckboxIndicatorImpl asChild={props.asChild} transition={transition} visible={visible}>
        {props.children}
      </CheckboxIndicatorImpl>
    );
  }

  const exitFallbackMs = getMotionTransitionExitFallbackMs(transition);

  return (
    <Presence
      exitFallbackMs={exitFallbackMs}
      present={visible}
      render={(state) => (
        <CheckboxIndicatorImpl
          asChild={props.asChild}
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
