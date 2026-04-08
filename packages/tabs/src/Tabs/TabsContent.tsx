import { React, Slot } from "@lattice-ui/core";
import { Presence } from "@lattice-ui/layer";
import { createSurfaceRevealRecipe, type PresenceMotionConfig, usePresenceMotion } from "@lattice-ui/motion";
import { useTabsContext } from "./context";
import { createTabsContentName } from "./internals/ids";
import type { TabsContentProps } from "./types";

function TabsContentImpl(props: {
  motionPresent: boolean;
  visible: boolean;
  transition?: PresenceMotionConfig;
  onExitComplete?: () => void;
  value: string;
  asChild?: boolean;
  children?: React.ReactNode;
}) {
  const contentName = createTabsContentName(props.value);
  const defaultTransition = React.useMemo(() => createSurfaceRevealRecipe(), []);

  const config = React.useMemo(() => {
    if (!props.transition) return defaultTransition;
    return props.transition;
  }, [defaultTransition, props.transition]);

  const motionRef = usePresenceMotion<Frame>(props.motionPresent, config, props.onExitComplete);

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

  if (forceMount) {
    return (
      <TabsContentImpl
        asChild={props.asChild}
        motionPresent={selected}
        transition={props.transition}
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
          transition={props.transition}
          value={props.value}
          visible={true}
        >
          {props.children}
        </TabsContentImpl>
      )}
    />
  );
}
