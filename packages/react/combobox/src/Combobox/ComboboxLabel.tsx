import { getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import type { ComboboxLabelProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// See ComboboxTrigger: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

export const ComboboxLabel = React.forwardRef<TextLabel, ComboboxLabelProps>((props, forwardedRef) => {
  const passthrough = getPassthroughProps<TextLabel>(props, OWN_PROPS, forwardedRef);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ComboboxLabel] `asChild` requires a child element.");
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
ComboboxLabel.displayName = "ComboboxLabel";
