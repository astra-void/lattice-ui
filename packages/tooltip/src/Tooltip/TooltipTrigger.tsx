import { React, Slot } from "@lattice-ui/core";
import { DEFAULT_TOOLTIP_TRIGGER_ACTIVITY_STATE, updateTooltipTriggerActivity } from "./activity";
import { useTooltipContext } from "./context";
import type { TooltipTriggerProps } from "./types";

function toGuiObject(instance: Instance | undefined) {
  if (!instance?.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

export function TooltipTrigger(props: TooltipTriggerProps) {
  const tooltipContext = useTooltipContext();
  const activityStateRef = React.useRef(DEFAULT_TOOLTIP_TRIGGER_ACTIVITY_STATE);

  const setTriggerRef = React.useCallback(
    (instance: Instance | undefined) => {
      tooltipContext.triggerRef.current = toGuiObject(instance);
    },
    [tooltipContext.triggerRef],
  );

  const applyActivity = React.useCallback(
    (kind: "hover" | "focus", active: boolean) => {
      const result = updateTooltipTriggerActivity(activityStateRef.current, kind, active);
      activityStateRef.current = result.state;

      if (props.disabled) {
        if (!active) {
          tooltipContext.close();
        }
        return;
      }

      if (result.action === "open") {
        if (kind === "focus") {
          tooltipContext.setOpen(true);
        } else {
          tooltipContext.openWithDelay();
        }
        return;
      }

      if (result.action === "close") {
        tooltipContext.close();
      }
    },
    [props.disabled, tooltipContext],
  );

  React.useEffect(() => {
    if (!props.disabled) {
      return;
    }

    activityStateRef.current = DEFAULT_TOOLTIP_TRIGGER_ACTIVITY_STATE;
    tooltipContext.close();
  }, [props.disabled, tooltipContext]);

  const eventHandlers = React.useMemo(
    () => ({
      MouseEnter: () => applyActivity("hover", true),
      MouseLeave: () => applyActivity("hover", false),
      SelectionGained: () => applyActivity("focus", true),
      SelectionLost: () => applyActivity("focus", false),
    }),
    [applyActivity],
  );

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[TooltipTrigger] `asChild` requires a child element.");
    }

    return (
      <Slot
        Active={props.disabled !== true}
        Event={eventHandlers}
        Selectable={props.disabled !== true}
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
