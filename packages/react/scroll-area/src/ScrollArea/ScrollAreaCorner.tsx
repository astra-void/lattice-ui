import { getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import { useScrollAreaContext } from "./context";
import type { ScrollAreaCornerProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// Only the Roblox instance defaults are neutralized; where the corner sits and what it looks like
// are the consumer's decisions. Passthrough props are spread after these.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

export function ScrollAreaCorner(props: ScrollAreaCornerProps) {
  const scrollAreaContext = useScrollAreaContext();
  const visible = scrollAreaContext.showHorizontalScrollbar && scrollAreaContext.showVerticalScrollbar;

  const passthrough = getPassthroughProps<Frame>(props, OWN_PROPS);
  const behaviorProps = {
    Visible: visible,
  };

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[ScrollAreaCorner] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return (
      <Slot {...toSlotProps(passthrough)} {...behaviorProps}>
        {child}
      </Slot>
    );
  }

  return (
    <frame {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps}>
      {props.children}
    </frame>
  );
}
