import { React, Slot } from "@lattice-ui/core";
import { useStateMotion } from "@lattice-ui/motion";
import { Presence } from "@lattice-ui/layer";
import { useTabsContext } from "./context";
import { createTabsContentName } from "./internals/ids";
import type { TabsContentProps } from "./types";

const CONTENT_TWEEN_INFO = new TweenInfo(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);
const CONTENT_EXIT_TWEEN_INFO = new TweenInfo(0.09, Enum.EasingStyle.Quad, Enum.EasingDirection.In);
const CONTENT_OFFSET = 4;

function buildTabsContentTransition(): unknown {
  return {
    enter: {
      tweenInfo: CONTENT_TWEEN_INFO,
      from: {
        Position: UDim2.fromOffset(0, CONTENT_OFFSET),
      },
      to: {
        Position: UDim2.fromOffset(0, 0),
      },
    },
    exit: {
      tweenInfo: CONTENT_EXIT_TWEEN_INFO,
      to: {
        Position: UDim2.fromOffset(0, CONTENT_OFFSET),
      },
    },
  };
}

function TabsContentImpl(props: {
  visible: boolean;
  transition?: unknown | false;
  onExitComplete?: () => void;
  value: string;
  asChild?: boolean;
  children?: React.ReactNode;
}) {
  const contentName = createTabsContentName(props.value);
  const contentRef = React.useRef<Frame>();

  const __motionRef = useStateMotion(props.visible, props.transition as unknown, false);
  React.useLayoutEffect(() => {
    if (__motionRef.current && contentRef.current !== __motionRef.current) {
      contentRef.current = __motionRef.current as unknown;
    }
  }, [__motionRef]);

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[TabsContent] `asChild` requires a child element.");
    }

    return (
      <Slot Name={contentName} Visible={props.visible} ref={contentRef}>
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
      ref={contentRef}
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
    return buildTabsContentTransition();
  }, [props.transition]);

  if (forceMount) {
    return (
      <TabsContentImpl asChild={props.asChild} transition={transition} value={props.value} visible={selected}>
        {props.children}
      </TabsContentImpl>
    );
  }

  const exitFallbackMs = 0;

  return (
    <Presence
      exitFallbackMs={exitFallbackMs}
      present={selected}
      render={(state) => (
        <TabsContentImpl
          asChild={props.asChild}
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
