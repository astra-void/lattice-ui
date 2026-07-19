import { composeEvents, composeRefs, getPassthroughProps, React, Slot } from "@lattice-ui/react-runtime";
import { DEFAULT_TOOLTIP_TRIGGER_ACTIVITY_STATE, updateTooltipTriggerActivity } from "./activity";
import { useTooltipContext } from "./context";
import type { TooltipTriggerProps } from "./types";

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

  const passthrough = getPassthroughProps(props, OWN_PROPS);
  const behaviorProps = {
    Active: props.disabled !== true,
    Event: composeEvents(passthrough.Event, eventHandlers),
    Selectable: props.disabled !== true,
    ref: composeRefs<Instance>(passthrough.ref as never, setTriggerRef),
  };

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[TooltipTrigger] `asChild` requires a child element.");
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
