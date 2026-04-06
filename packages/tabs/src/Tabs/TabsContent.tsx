import { React, Slot } from "@lattice-ui/core";
import { Presence } from "@lattice-ui/layer";
import { type MotionConfig, useMotionController, useMotionPresence } from "@lattice-ui/motion";
import { useTabsContext } from "./context";
import { createTabsContentName } from "./internals/ids";
import type { TabsContentProps } from "./types";

const CONTENT_TWEEN_INFO = new TweenInfo(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);
const CONTENT_EXIT_TWEEN_INFO = new TweenInfo(0.09, Enum.EasingStyle.Quad, Enum.EasingDirection.In);
const CONTENT_OFFSET = 4;

function buildTabsContentTransition(): MotionConfig {
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

function TabsContentImpl(props: {
  motionPresent: boolean;
  visible: boolean;
  transition?: MotionConfig | false;
  onExitComplete?: () => void;
  value: string;
  asChild?: boolean;
  children?: React.ReactNode;
}) {
  const contentName = createTabsContentName(props.value);
  const motionRef = usePresenceStateMotion<Frame>(
    props.motionPresent,
    props.transition || {},
    true,
    props.onExitComplete,
  );

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[TabsContent] `asChild` requires a child element.");
    }

    return (
      <Slot Name={contentName} Visible={props.visible} ref={motionRef}>
        {child}
      </Slot>
    );
  }

  return (
    <frame
      BackgroundTransparency={1}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(0, 0)}
      Visible={props.visible}
      ref={motionRef}
    >
      {props.children}
    </frame>
  );
}

export function TabsContent(props: TabsContentProps) {
  const tabsContext = useTabsContext();
  const selected = tabsContext.value === props.value;
  const forceMount = props.forceMount === true;

  const transition = React.useMemo(() => {
    return mergeMotionConfig(buildTabsContentTransition(), props.transition);
  }, [props.transition]);

  if (forceMount) {
    return (
      <TabsContentImpl
        asChild={props.asChild}
        motionPresent={selected}
        transition={transition}
        value={props.value}
        visible={selected}
      >
        {props.children}
      </TabsContentImpl>
    );
  }

  return (
    <Presence
      present={selected}
      render={(state) => (
        <TabsContentImpl
          asChild={props.asChild}
          motionPresent={state.isPresent}
          onExitComplete={state.onExitComplete}
          transition={transition}
          value={props.value}
          visible={true}
        >
          {props.children}
        </TabsContentImpl>
      )}
    />
  );
}
