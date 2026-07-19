import { getPassthroughProps, React, Slot } from "@lattice-ui/react-runtime";
import type { ToastDescriptionProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// See ToastRoot: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

export function ToastDescription(props: ToastDescriptionProps) {
  const passthrough = getPassthroughProps(props, OWN_PROPS);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ToastDescription] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return <Slot {...passthrough}>{child}</Slot>;
  }

  return <textlabel {...NEUTRAL_PROPS} {...passthrough} />;
}
