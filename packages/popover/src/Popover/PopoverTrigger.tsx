import { React, Slot } from "@lattice-ui/core";
import { usePopoverContext } from "./context";
import type { PopoverTriggerProps } from "./types";

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

export function PopoverTrigger(props: PopoverTriggerProps) {
  const popoverContext = usePopoverContext();

  const setTriggerRef = React.useCallback(
    (instance: Instance | undefined) => {
      popoverContext.triggerRef.current = toGuiObject(instance);
    },
    [popoverContext.triggerRef],
  );

  const handleActivated = React.useCallback(() => {
    if (props.disabled) {
      return;
    }

    popoverContext.setOpen(!popoverContext.open);
  }, [popoverContext.open, popoverContext.setOpen, props.disabled]);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[PopoverTrigger] `asChild` requires a child element.");
    }

    return (
      <Slot Event={{ Activated: handleActivated }} ref={setTriggerRef}>
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
      Selectable={props.disabled !== true}
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
