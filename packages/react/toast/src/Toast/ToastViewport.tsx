import { getPassthroughProps, React, Slot } from "@lattice-ui/react-runtime";
import type { ToastViewportProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// See ToastRoot: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

export function ToastViewport(props: ToastViewportProps) {
  const passthrough = getPassthroughProps(props, OWN_PROPS);

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[ToastViewport] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return <Slot {...passthrough}>{child}</Slot>;
  }

  // The viewport is only the container. Consumers render the queue themselves by mapping
  // `useToast().visibleToasts` onto `Toast.Root`, so no toast markup is baked in here.
  return (
    <frame {...NEUTRAL_PROPS} {...passthrough}>
      {props.children}
    </frame>
  );
}
