import { getPassthroughProps, React, Slot } from "@lattice-ui/react-runtime";
import type { MenuSeparatorProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// See MenuTrigger: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

export function MenuSeparator(props: MenuSeparatorProps) {
  const passthrough = getPassthroughProps(props, OWN_PROPS);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[MenuSeparator] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return <Slot {...passthrough}>{child}</Slot>;
  }

  return <frame {...NEUTRAL_PROPS} {...passthrough} />;
}
