import { useActivationGuard, useFocusNode } from "@lattice-ui/react-focus";
import { composeEvents, composeRefs, getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
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

  const closeRef = React.useRef<GuiObject>();
  const setCloseRef = React.useCallback((instance: Instance | undefined) => {
    closeRef.current = instance?.IsA("GuiObject") ? instance : undefined;
  }, []);

  const claimActivation = useActivationGuard();

  // Pointer clicks arrive through `Activated`, keyboard and gamepad through the
  // focus node's `onActivate`; the guard keeps one press from closing twice.
  const handleActivated = React.useCallback(() => {
    if (!claimActivation()) {
      return;
    }

    popoverContext.setOpen(false);
  }, [claimActivation, popoverContext.setOpen]);

  // Registered so the navigation controller can reach Close inside the trapped
  // content scope; an unregistered button is invisible to directional moves.
  useFocusNode({
    ref: closeRef,
    onActivate: handleActivated,
  });

  const passthrough = getPassthroughProps<TextButton>(props, OWN_PROPS);
  const behaviorProps = {
    Active: true,
    Event: composeEvents(passthrough.Event, { Activated: handleActivated }),
    Selectable: true,
  };
  const ref = composeRefs<Instance>(passthrough.ref as never, setCloseRef);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[PopoverClose] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return (
      <Slot {...toSlotProps(passthrough)} {...behaviorProps} ref={ref}>
        {child}
      </Slot>
    );
  }

  return (
    <textbutton {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps} ref={ref as never}>
      {props.children}
    </textbutton>
  );
}
