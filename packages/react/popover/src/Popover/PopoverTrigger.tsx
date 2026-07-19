import { focusGuiObject, useFocusNode } from "@lattice-ui/react-focus";
import { composeEvents, composeRefs, getPassthroughProps, React, Slot } from "@lattice-ui/react-runtime";
import { usePopoverContext } from "./context";
import type { PopoverTriggerProps } from "./types";

const OWN_PROPS = ["asChild", "disabled", "children"] as const;

// Roblox instance defaults are themselves a look: a bare `textbutton` renders an opaque grey box
// labelled "Button". Neutralize only that; every real appearance decision belongs to the consumer.
// Passthrough props are spread after these, so they stay overridable.
const NEUTRAL_PROPS = {
  AutoButtonColor: false,
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

function toGuiObject(instance: Instance | undefined) {
  if (!instance?.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

export function PopoverTrigger(props: PopoverTriggerProps) {
  const popoverContext = usePopoverContext();
  const triggerRef = popoverContext.triggerRef;

  const setTriggerRef = React.useCallback(
    (instance: Instance | undefined) => {
      const previousTrigger = triggerRef.current;
      const nextTrigger = toGuiObject(instance);

      triggerRef.current = nextTrigger;

      if (popoverContext.anchorRef.current === undefined || popoverContext.anchorRef.current === previousTrigger) {
        popoverContext.anchorRef.current = nextTrigger;
      }
    },
    [popoverContext.anchorRef, triggerRef],
  );

  useFocusNode({
    ref: triggerRef,
    disabled: props.disabled === true,
    syncToRoblox: false,
  });

  const handleActivated = React.useCallback(() => {
    if (props.disabled) {
      return;
    }

    if (!popoverContext.open) {
      focusGuiObject(triggerRef.current);
    }

    popoverContext.setOpen(!popoverContext.open);
  }, [popoverContext.open, popoverContext.setOpen, props.disabled, triggerRef]);

  const passthrough = getPassthroughProps(props, OWN_PROPS);
  const behaviorProps = {
    Active: props.disabled !== true,
    Event: composeEvents(passthrough.Event, { Activated: handleActivated }),
    Selectable: false,
    ref: composeRefs<Instance>(passthrough.ref as never, setTriggerRef),
  };

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[PopoverTrigger] `asChild` requires a child element.");
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
