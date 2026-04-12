import { React, Slot } from "@lattice-ui/core";
import { Presence } from "@lattice-ui/layer";
import { createSurfaceRevealRecipe, type PresenceMotionConfig, usePresenceMotionController } from "@lattice-ui/motion";
import { useTabsContext } from "./context";
import { createTabsContentName } from "./internals/ids";
import type { TabsContentProps } from "./types";

function TabsContentImpl(props: {
  present: boolean;
  forceMount?: boolean;
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

  const motion = usePresenceMotionController<Frame>({
    present: props.present,
    forceMount: props.forceMount,
    config,
    onExitComplete: props.onExitComplete,
  });

  const mounted = motion.mounted;
  const visible = mounted && (motion.present || motion.phase !== "exited");

  if (!mounted) {
    return undefined;
  }

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[TabsContent] `asChild` requires a child element.");
    }

    return (
      <Slot Name={contentName} Visible={visible} ref={motion.ref}>
        {child}
      </Slot>
    );
  }

  return (
    <frame
      BackgroundTransparency={1}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(0, 0)}
      Visible={visible}
      ref={motion.ref}
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
        forceMount={true}
        present={selected}
        transition={props.transition}
        value={props.value}
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
          onExitComplete={state.onExitComplete}
          present={state.isPresent}
          transition={props.transition}
          value={props.value}
        >
          {props.children}
        </TabsContentImpl>
      )}
    />
  );
}
