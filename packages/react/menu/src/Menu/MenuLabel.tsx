import { getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import type { MenuLabelProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// See MenuTrigger: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

export const MenuLabel = React.forwardRef<TextLabel, MenuLabelProps>((props, forwardedRef) => {
  const passthrough = getPassthroughProps<TextLabel>(props, OWN_PROPS, forwardedRef);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[MenuLabel] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return <Slot {...toSlotProps(passthrough)}>{child}</Slot>;
  }

  return (
    <textlabel {...NEUTRAL_PROPS} {...passthrough}>
      {props.children}
    </textlabel>
  );
});
MenuLabel.displayName = "MenuLabel";
