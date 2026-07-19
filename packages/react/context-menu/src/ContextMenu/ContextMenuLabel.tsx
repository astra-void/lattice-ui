import { getPassthroughProps, React, Slot } from "@lattice-ui/react-runtime";
import type { ContextMenuLabelProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// See ContextMenuTrigger: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

export function ContextMenuLabel(props: ContextMenuLabelProps) {
  const passthrough = getPassthroughProps(props, OWN_PROPS);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ContextMenuLabel] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return <Slot {...passthrough}>{child}</Slot>;
  }

  return (
    <textlabel {...NEUTRAL_PROPS} {...passthrough}>
      {props.children}
    </textlabel>
  );
}
