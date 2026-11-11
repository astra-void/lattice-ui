import { getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import type { ToastTitleProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// See ToastRoot: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

export const ToastTitle = React.forwardRef<TextLabel, ToastTitleProps>((props, forwardedRef) => {
  const passthrough = getPassthroughProps<TextLabel>(props, OWN_PROPS, forwardedRef);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ToastTitle] `asChild` requires a child element.");
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
ToastTitle.displayName = "ToastTitle";
