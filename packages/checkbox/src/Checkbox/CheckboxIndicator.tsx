import { React, Slot } from "@lattice-ui/core";
import { MOTION_PRESETS, useStateMotion } from "@lattice-ui/motion";
import type { MotionConfig } from "@lattice-ui/motion";
import { Presence } from "@lattice-ui/layer";
import { useCheckboxContext } from "./context";
import type { CheckboxIndicatorProps } from "./types";

function buildCheckboxIndicatorTransition(size: UDim2): MotionConfig {
  return {
    entering: {
      tweenInfo: MOTION_PRESETS.indicatorEnter,
      initial: {
        Size: UDim2.fromOffset(0, 0),
        BackgroundTransparency: 1,
      },
      goals: {
        Size: size,
        BackgroundTransparency: 0,
      },
    },
    entered: {
      goals: {
        Size: size,
        BackgroundTransparency: 0,
      },
    },
    exiting: {
      tweenInfo: MOTION_PRESETS.indicatorExit,
      goals: {
        Size: UDim2.fromOffset(0, 0),
        BackgroundTransparency: 1,
      },
    },
  };
}

function CheckboxIndicatorImpl(props: {
  visible: boolean;
  transition?: MotionConfig;
  onExitComplete?: () => void;
  asChild?: boolean;
  children?: React.ReactNode;
}) {
  const indicatorRef = React.useRef<Frame>();

  const __motionRef = useStateMotion(props.visible, props.transition || ({} as MotionConfig), false);
  React.useLayoutEffect(() => {
    if (__motionRef.current && indicatorRef.current !== __motionRef.current) {
      indicatorRef.current = __motionRef.current as Frame;
    }
  }, [__motionRef]);

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
    return {
      ...buildCheckboxIndicatorTransition(UDim2.fromOffset(12, 12)),
      ...(props.transition as MotionConfig | undefined),
    };
  }, [props.transition]);

  if (forceMount) {
    return (
      <CheckboxIndicatorImpl asChild={props.asChild} transition={transition} visible={visible}>
        {props.children}
      </CheckboxIndicatorImpl>
    );
  }

  const exitFallbackMs = 0;

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
