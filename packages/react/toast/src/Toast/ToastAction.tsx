import { composeEvents, getPassthroughProps, React, Slot } from "@lattice-ui/react-runtime";
import type { ToastActionProps } from "./types";

const OWN_PROPS = ["asChild", "onAction", "children"] as const;

// See ToastRoot: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  AutoButtonColor: false,
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

export function ToastAction(props: ToastActionProps) {
  const handleActivated = React.useCallback(() => {
    props.onAction?.();
  }, [props]);

  const passthrough = getPassthroughProps(props, OWN_PROPS);
  const behaviorProps = {
    Active: true,
    Event: composeEvents(passthrough.Event, { Activated: handleActivated }),
    Selectable: true,
  };

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ToastAction] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return (
      <Slot {...passthrough} {...behaviorProps}>
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
