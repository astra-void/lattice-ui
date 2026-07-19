import { composeEvents, composeRefs, getPassthroughProps, React, Slot } from "@lattice-ui/react-runtime";
import { ContextMenuItemContextProvider, useContextMenuContext } from "./context";
import type { ContextMenuItemProps, ContextMenuSelectEvent } from "./types";

const OWN_PROPS = ["asChild", "disabled", "onSelect", "children"] as const;

// See ContextMenuTrigger: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  AutoButtonColor: false,
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

function createContextMenuSelectEvent(): ContextMenuSelectEvent {
  const event: ContextMenuSelectEvent = {
    defaultPrevented: false,
    preventDefault: () => {
      event.defaultPrevented = true;
    },
  };

  return event;
}

export function ContextMenuItem(props: ContextMenuItemProps) {
  const contextMenuContext = useContextMenuContext();
  const itemRef = React.useRef<GuiObject>();

  const [highlighted, setHighlighted] = React.useState(false);

  const setItemRef = React.useCallback((instance: Instance | undefined) => {
    itemRef.current = !instance?.IsA("GuiObject") ? undefined : instance;
  }, []);

  const handleActivated = React.useCallback(() => {
    if (props.disabled) {
      return;
    }

    const event = createContextMenuSelectEvent();
    props.onSelect?.(event);

    if (!event.defaultPrevented) {
      contextMenuContext.setOpen(false);
    }
  }, [contextMenuContext, props.disabled, props.onSelect]);

  const handlePointerEnter = React.useCallback(() => setHighlighted(true), []);
  const handlePointerLeave = React.useCallback(() => setHighlighted(false), []);

  const ownEvents = React.useMemo(
    () => ({
      Activated: handleActivated,
      MouseEnter: handlePointerEnter,
      MouseLeave: handlePointerLeave,
    }),
    [handleActivated, handlePointerEnter, handlePointerLeave],
  );

  const disabled = props.disabled === true;

  // Highlight is tracked, never painted: consumers read it here and style however they like.
  const itemContextValue = React.useMemo(
    () => ({
      highlighted: highlighted && !disabled,
      disabled,
    }),
    [disabled, highlighted],
  );

  const passthrough = getPassthroughProps(props, OWN_PROPS);
  const behaviorProps = {
    Active: !disabled,
    Event: composeEvents(passthrough.Event, ownEvents),
  };
  const ref = composeRefs<Instance>(passthrough.ref as never, setItemRef);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ContextMenuItem] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return (
      <ContextMenuItemContextProvider value={itemContextValue}>
        <Slot {...passthrough} {...behaviorProps} ref={ref}>
          {child}
        </Slot>
      </ContextMenuItemContextProvider>
    );
  }

  return (
    <ContextMenuItemContextProvider value={itemContextValue}>
      <textbutton {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps} ref={ref as never}>
        {props.children}
      </textbutton>
    </ContextMenuItemContextProvider>
  );
}
