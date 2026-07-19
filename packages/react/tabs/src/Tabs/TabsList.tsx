import { getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import type { TabsListProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// Roblox instance defaults are themselves a look: a bare `frame` renders an opaque grey box.
// Neutralize only that, and leave every real appearance decision to the consumer. Passthrough props
// are spread after these, so they stay overridable.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

export function TabsList(props: TabsListProps) {
  const passthrough = getPassthroughProps<Frame>(props, OWN_PROPS);

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[TabsList] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return <Slot {...toSlotProps(passthrough)}>{child}</Slot>;
  }

  return (
    <frame {...NEUTRAL_PROPS} {...passthrough}>
      {props.children}
    </frame>
  );
}
