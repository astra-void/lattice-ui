import { React, Slot } from "@lattice-ui/core";
import { Presence } from "@lattice-ui/layer";
import { type MotionConfig, useMotionController, useMotionPresence } from "@lattice-ui/motion";
import { useAccordionItemContext } from "./context";
import type { AccordionContentProps } from "./types";

const CONTENT_TWEEN_INFO = new TweenInfo(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);
const CONTENT_EXIT_TWEEN_INFO = new TweenInfo(0.09, Enum.EasingStyle.Quad, Enum.EasingDirection.In);
const CONTENT_OFFSET = 4;

function buildAccordionContentTransition(): MotionConfig {
  return {
    entering: {
      tweenInfo: CONTENT_TWEEN_INFO,
      initial: {
        Position: UDim2.fromOffset(0, CONTENT_OFFSET),
      },
      goals: {
        Position: UDim2.fromOffset(0, 0),
      },
    },
    exiting: {
      tweenInfo: CONTENT_EXIT_TWEEN_INFO,
      goals: {
        Position: UDim2.fromOffset(0, CONTENT_OFFSET),
      },
    },
  };
}

function mergeMotionConfig(baseConfig: MotionConfig, overrideConfig?: MotionConfig): MotionConfig {
  if (!overrideConfig) {
    return baseConfig;
  }

  return {
    entering: { ...baseConfig.entering, ...overrideConfig.entering },
    entered: { ...baseConfig.entered, ...overrideConfig.entered },
    exiting: { ...baseConfig.exiting, ...overrideConfig.exiting },
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

function AccordionContentImpl(props: {
  motionPresent: boolean;
  visible: boolean;
  transition?: MotionConfig | false;
  onExitComplete?: () => void;
  asChild?: boolean;
  children?: React.ReactNode;
}) {
  const motionRef = usePresenceStateMotion<Frame>(
    props.motionPresent,
    props.transition || {},
    true,
    props.onExitComplete,
  );

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[AccordionContent] `asChild` requires a child element.");
    }

    return (
      <Slot Visible={props.visible} ref={motionRef}>
        {child}
      </Slot>
    );
  }

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(35, 41, 54)}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(260, 44)}
      Visible={props.visible}
      ref={motionRef}
    >
      {props.children}
    </frame>
  );
}

export function AccordionContent(props: AccordionContentProps) {
  const itemContext = useAccordionItemContext();
  const forceMount = props.forceMount === true;

  const transition = React.useMemo(() => {
    return mergeMotionConfig(buildAccordionContentTransition(), props.transition);
  }, [props.transition]);

  if (forceMount) {
    return (
      <AccordionContentImpl
        asChild={props.asChild}
        motionPresent={itemContext.open}
        transition={transition}
        visible={itemContext.open}
      >
        {props.children}
      </AccordionContentImpl>
    );
  }

  return (
    <Presence
      present={itemContext.open}
      render={(state) => (
        <AccordionContentImpl
          asChild={props.asChild}
          motionPresent={state.isPresent}
          onExitComplete={state.onExitComplete}
          transition={transition}
          visible={true}
        >
          {props.children}
        </AccordionContentImpl>
      )}
    />
  );
}
