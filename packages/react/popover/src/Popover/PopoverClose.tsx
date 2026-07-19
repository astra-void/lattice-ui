import { composeEvents, getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import { usePopoverContext } from "./context";
import type { PopoverCloseProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// See PopoverTrigger: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  AutoButtonColor: false,
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

export function PopoverClose(props: PopoverCloseProps) {
  const popoverContext = usePopoverContext();

  const handleActivated = React.useCallback(() => {
    popoverContext.setOpen(false);
  }, [popoverContext.setOpen]);

  const passthrough = getPassthroughProps<TextButton>(props, OWN_PROPS);
  const behaviorProps = {
    Active: true,
    Event: composeEvents(passthrough.Event, { Activated: handleActivated }),
    Selectable: false,
  };

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[PopoverClose] `asChild` requires a child element.");
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
