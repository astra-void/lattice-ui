import { composeEvents, getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import type { ToastCloseProps } from "./types";

const OWN_PROPS = ["asChild", "onClose", "children"] as const;

// See ToastRoot: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  AutoButtonColor: false,
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

export function ToastClose(props: ToastCloseProps) {
  const handleActivated = React.useCallback(() => {
    props.onClose?.();
  }, [props]);

  const passthrough = getPassthroughProps<TextButton>(props, OWN_PROPS);
  const behaviorProps = {
    Active: true,
    Event: composeEvents(passthrough.Event, { Activated: handleActivated }),
    Selectable: true,
  };

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ToastClose] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return (
      <Slot {...toSlotProps(passthrough)} {...behaviorProps}>
        {child}
      </Slot>
    );
  }

  return (
    <textbutton {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps}>
      {props.children}
    </textbutton>
  );
}
