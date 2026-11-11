import { getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import type { ComboboxGroupProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// See ComboboxTrigger: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

export const ComboboxGroup = React.forwardRef<Frame, ComboboxGroupProps>((props, forwardedRef) => {
  const passthrough = getPassthroughProps<Frame>(props, OWN_PROPS, forwardedRef);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ComboboxGroup] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return <Slot {...toSlotProps(passthrough)}>{child}</Slot>;
  }

  return (
    <frame {...NEUTRAL_PROPS} {...passthrough}>
      {props.children}
    </frame>
  );
});
ComboboxGroup.displayName = "ComboboxGroup";
