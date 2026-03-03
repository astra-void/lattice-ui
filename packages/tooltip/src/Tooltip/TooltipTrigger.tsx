import { React, Slot } from "@lattice-ui/core";
import { useTooltipContext } from "./context";
import type { TooltipTriggerProps } from "./types";

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

export function TooltipTrigger(props: TooltipTriggerProps) {
  const tooltipContext = useTooltipContext();

  const setTriggerRef = React.useCallback(
    (instance: Instance | undefined) => {
      tooltipContext.triggerRef.current = toGuiObject(instance);
    },
    [tooltipContext.triggerRef],
  );

  const handleOpen = React.useCallback(() => {
    if (props.disabled) {
      return;
    }

    tooltipContext.openWithDelay();
  }, [props.disabled, tooltipContext]);

  const handleClose = React.useCallback(() => {
    tooltipContext.close();
  }, [tooltipContext]);

  const eventHandlers = React.useMemo(
    () => ({
      MouseEnter: handleOpen,
      MouseLeave: handleClose,
      SelectionGained: handleOpen,
      SelectionLost: handleClose,
    }),
    [handleClose, handleOpen],
  );

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[TooltipTrigger] `asChild` requires a child element.");
    }

    return (
      <Slot Event={eventHandlers} ref={setTriggerRef}>
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
      Event={eventHandlers}
      Selectable={props.disabled !== true}
      Size={UDim2.fromOffset(140, 36)}
      Text="Tooltip Trigger"
      TextColor3={Color3.fromRGB(240, 244, 250)}
      TextSize={15}
      ref={setTriggerRef}
    >
      {props.children}
    </textbutton>
  );
}
