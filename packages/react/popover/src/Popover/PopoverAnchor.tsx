import { composeRefs, getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import { usePopoverContext } from "./context";
import type { PopoverAnchorProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// See PopoverTrigger: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

function toGuiObject(instance: Instance | undefined) {
  if (!instance?.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

export function PopoverAnchor(props: PopoverAnchorProps) {
  const popoverContext = usePopoverContext();

  const setAnchorRef = React.useCallback(
    (instance: Instance | undefined) => {
      popoverContext.anchorRef.current = toGuiObject(instance);
    },
    [popoverContext.anchorRef],
  );

  const passthrough = getPassthroughProps<Frame>(props, OWN_PROPS);
  const behaviorProps = {
    ref: composeRefs<Instance>(passthrough.ref as never, setAnchorRef),
  };

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[PopoverAnchor] `asChild` requires a child element.");
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
