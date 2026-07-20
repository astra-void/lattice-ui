import { focusGuiObject, useActivationGuard, useFocusNode } from "@lattice-ui/react-focus";
import { composeEvents, composeRefs, getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import { useMenuContext } from "./context";
import type { MenuTriggerProps } from "./types";

const OWN_PROPS = ["asChild", "disabled", "children"] as const;

// Roblox instance defaults are themselves a look: a bare `textbutton` renders an opaque grey box
// labelled "Button". Neutralize only that, and leave every real appearance decision (colors, size,
// fonts, text) to the consumer. Passthrough props are spread after these, so they stay overridable.
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

export function MenuTrigger(props: MenuTriggerProps) {
  const menuContext = useMenuContext();
  const triggerRef = menuContext.triggerRef;

  const setTriggerRef = React.useCallback(
    (instance: Instance | undefined) => {
      triggerRef.current = toGuiObject(instance);
    },
    [triggerRef],
  );

  const claimActivation = useActivationGuard();

  // Pointer clicks arrive through `Activated`, keyboard and gamepad through the
  // focus node's `onActivate`; the guard keeps a single activation from toggling
  // the menu twice when the engine fires both.
  const handleActivated = React.useCallback(() => {
    if (props.disabled || !claimActivation()) {
      return;
    }

    if (!menuContext.open) {
      focusGuiObject(triggerRef.current);
    }

    menuContext.setOpen(!menuContext.open);
  }, [claimActivation, menuContext.open, menuContext.setOpen, props.disabled, triggerRef]);

  useFocusNode({
    ref: triggerRef,
    disabled: props.disabled === true,
    onActivate: handleActivated,
  });

  const passthrough = getPassthroughProps<TextButton>(props, OWN_PROPS);
  const behaviorProps = {
    Active: props.disabled !== true,
    Event: composeEvents(passthrough.Event, { Activated: handleActivated }),
    Selectable: props.disabled !== true,
  };
  const ref = composeRefs<Instance>(passthrough.ref as never, setTriggerRef);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[MenuTrigger] `asChild` requires a child element.");
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
