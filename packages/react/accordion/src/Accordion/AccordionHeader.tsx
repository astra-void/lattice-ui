import { getPassthroughProps, React, Slot } from "@lattice-ui/react-runtime";
import type { AccordionHeaderProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// See AccordionItem: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

export function AccordionHeader(props: AccordionHeaderProps) {
  const passthrough = getPassthroughProps(props, OWN_PROPS);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[AccordionHeader] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return <Slot {...passthrough}>{child}</Slot>;
  }

  return (
    <frame {...NEUTRAL_PROPS} {...passthrough}>
      {props.children}
    </frame>
  );
}
