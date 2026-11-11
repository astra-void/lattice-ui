import { getPassthroughProps, getSlotChild, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import type { ToastViewportProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// See ToastRoot: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

export const ToastViewport = React.forwardRef<Frame, ToastViewportProps>((props, forwardedRef) => {
  const passthrough = getPassthroughProps<Frame>(props, OWN_PROPS, forwardedRef);

  if (props.asChild) {
    const child = props.children;
    if (getSlotChild(child) === undefined) {
      error("[ToastViewport] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return <Slot {...toSlotProps(passthrough)}>{child}</Slot>;
  }

  // The viewport is only the container. Consumers render the queue themselves by mapping
  // `useToast().visibleToasts` onto `Toast.Root`, so no toast markup is baked in here.
  return (
    <frame {...NEUTRAL_PROPS} {...passthrough}>
      {props.children}
    </frame>
  );
});
ToastViewport.displayName = "ToastViewport";
