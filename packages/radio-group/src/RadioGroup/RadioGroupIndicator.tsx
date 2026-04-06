import { React, Slot } from "@lattice-ui/core";
import { Presence } from "@lattice-ui/layer";
import { MOTION_PRESETS, type MotionConfig, useMotionController, useMotionPresence } from "@lattice-ui/motion";
import { useRadioGroupItemContext } from "./context";
import type { RadioGroupIndicatorProps } from "./types";

function buildRadioGroupIndicatorTransition(size: UDim2): MotionConfig {
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

function usePresenceStateMotion<T extends Instance = Instance>(
  present: boolean,
  config: MotionConfig,
  appear: boolean,
  onExitComplete?: () => void,
) {
  const { phase, markPhaseComplete } = useMotionPresence({ present, appear });
  const ref = React.useRef<T>();
  const onExitCompleteRef = React.useRef(onExitComplete);

  React.useEffect(() => {
    onExitCompleteRef.current = onExitComplete;
  }, [onExitComplete]);

  const handlePhaseComplete = React.useCallback(
    (completedPhase: "unmounted" | "entering" | "entered" | "exiting") => {
      markPhaseComplete(completedPhase);
      if (completedPhase === "exiting") {
        onExitCompleteRef.current?.();
      }
    },
    [markPhaseComplete],
  );

  useMotionController(ref as React.MutableRefObject<Instance | undefined>, config, phase, handlePhaseComplete);

  return ref;
}

function RadioGroupIndicatorImpl(props: {
  motionPresent: boolean;
  visible: boolean;
  transition?: MotionConfig;
  onExitComplete?: () => void;
  asChild?: boolean;
  children?: React.ReactNode;
}) {
  const motionRef = usePresenceStateMotion<Frame>(
    props.motionPresent,
    props.transition || ({} as MotionConfig),
    true,
    props.onExitComplete,
  );

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[RadioGroupIndicator] `asChild` requires a child element.");
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
      Size={UDim2.fromOffset(10, 10)}
      Visible={props.visible}
      ref={motionRef}
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
    return {
      ...buildRadioGroupIndicatorTransition(UDim2.fromOffset(10, 10)),
      ...(props.transition as MotionConfig | undefined),
    };
  }, [props.transition]);

  if (forceMount) {
    return (
      <RadioGroupIndicatorImpl
        asChild={props.asChild}
        motionPresent={visible}
        transition={transition}
        visible={visible}
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
          motionPresent={state.isPresent}
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
