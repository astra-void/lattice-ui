import { Presence } from "@lattice-ui/react-layer";
import { type PresenceMotionConfig, usePresenceMotionController } from "@lattice-ui/react-motion";
import {
  composeRefs,
  getPassthroughProps,
  getSlotChild,
  type PassthroughProps,
  React,
  Slot,
  toSlotProps,
} from "@lattice-ui/react-runtime";
import { useTabsContext } from "./context";
import { createTabsContentName } from "./internals/ids";
import type { TabsContentProps } from "./types";

const OWN_PROPS = ["transition", "value", "forceMount", "asChild", "children"] as const;

// See TabsTrigger: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

// An unstyled panel has nothing to animate, so there is no default recipe. Presence timing is still
// owned here; consumers opt into motion with `transition`.
const NO_MOTION: PresenceMotionConfig = {};

function TabsContentImpl(props: {
  present: boolean;
  forceMount?: boolean;
  transition?: PresenceMotionConfig;
  onExitComplete?: () => void;
  value: string;
  asChild?: boolean;
  children?: React.ReactNode;
  passthrough: PassthroughProps<Frame>;
}) {
  const contentName = createTabsContentName(props.value);
  const config = props.transition ?? NO_MOTION;

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

  const passthrough = props.passthrough;
  const ref = composeRefs<Frame>(passthrough.ref as never, motion.ref);

  if (props.asChild) {
    const child = props.children;
    if (getSlotChild(child) === undefined) {
      error("[TabsContent] `asChild` requires a child element.");
    }

    return (
      <Slot {...toSlotProps(passthrough)} Name={contentName} Visible={visible} ref={ref as never}>
        {child}
      </Slot>
    );
  }

  return (
    <frame {...NEUTRAL_PROPS} {...passthrough} Visible={visible} ref={ref}>
      {props.children}
    </frame>
  );
}

export function TabsContent(props: TabsContentProps) {
  const tabsContext = useTabsContext();
  const selected = tabsContext.value === props.value;
  const forceMount = props.forceMount === true;
  const passthrough = getPassthroughProps<Frame>(props, OWN_PROPS);

  if (forceMount) {
    return (
      <TabsContentImpl
        asChild={props.asChild}
        forceMount={true}
        passthrough={passthrough}
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
          passthrough={passthrough}
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
