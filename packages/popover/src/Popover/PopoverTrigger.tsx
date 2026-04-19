import { React, Slot } from "@lattice-ui/core";
import { focusGuiObject, useFocusNode } from "@lattice-ui/focus";
import { usePopoverContext } from "./context";
import type { PopoverTriggerProps } from "./types";

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

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[PopoverTrigger] `asChild` requires a child element.");
    }

    return (
      <Slot
        Active={props.disabled !== true}
        Event={{ Activated: handleActivated }}
        Selectable={false}
        ref={setTriggerRef}
      >
        {child}
      </Slot>
    );
  }

  return (
    <textbutton
      Active={props.disabled !== true}
      AutoButtonColor={false}
      BackgroundTransparency={1}
      BorderSizePixel={0}
      Event={{ Activated: handleActivated }}
      Selectable={false}
      Size={UDim2.fromOffset(150, 38)}
      Text="Toggle Popover"
      TextColor3={Color3.fromRGB(240, 244, 250)}
      TextSize={16}
      ref={setTriggerRef}
    >
      {props.children}
    </textbutton>
  );
}
