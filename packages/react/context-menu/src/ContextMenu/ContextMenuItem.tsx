import { useActivationGuard, useFocusNode } from "@lattice-ui/react-focus";
import { composeEvents, composeRefs, getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
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

let nextItemId = 0;
let nextItemOrder = 0;

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
  const disabledRef = React.useRef(props.disabled === true);

  // Pointer hover and managed focus are tracked apart so neither clears the
  // other: the item reads highlighted while either one is on it.
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    disabledRef.current = props.disabled === true;
  }, [props.disabled]);

  const itemIdRef = React.useRef(0);
  if (itemIdRef.current === 0) {
    nextItemId += 1;
    itemIdRef.current = nextItemId;
  }

  const itemOrderRef = React.useRef(0);
  if (itemOrderRef.current === 0) {
    nextItemOrder += 1;
    itemOrderRef.current = nextItemOrder;
  }

  const registerItem = contextMenuContext.registerItem;
  React.useEffect(() => {
    return registerItem({
      id: itemIdRef.current,
      order: itemOrderRef.current,
      ref: itemRef,
      getDisabled: () => disabledRef.current,
    });
  }, [registerItem]);

  const setItemRef = React.useCallback((instance: Instance | undefined) => {
    itemRef.current = !instance?.IsA("GuiObject") ? undefined : instance;
  }, []);

  const claimActivation = useActivationGuard();

  // A click and a keyboard/gamepad activation both land here: the mouse through
  // `Activated`, the keyboard through the focus node's `onActivate`. The guard
  // collapses the pair the engine still fires for a single selection.
  const handleActivated = React.useCallback(() => {
    if (props.disabled || !claimActivation()) {
      return;
    }

    const event = createContextMenuSelectEvent();
    props.onSelect?.(event);

    if (!event.defaultPrevented) {
      contextMenuContext.setOpen(false);
    }
  }, [claimActivation, contextMenuContext, props.disabled, props.onSelect]);

  // Directional movement, Enter/Space activation and the highlight all come from
  // the focus manager; the engine's own selection events are never consulted.
  useFocusNode({
    ref: itemRef,
    getDisabled: () => disabledRef.current,
    onFocusChange: setFocused,
    onActivate: handleActivated,
  });

  const handlePointerEnter = React.useCallback(() => setHovered(true), []);
  const handlePointerLeave = React.useCallback(() => setHovered(false), []);

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
      highlighted: (hovered || focused) && !disabled,
      disabled,
    }),
    [disabled, focused, hovered],
  );

  const passthrough = getPassthroughProps<TextButton>(props, OWN_PROPS);
  const behaviorProps = {
    Active: !disabled,
    Event: composeEvents(passthrough.Event, ownEvents),
    Selectable: !disabled,
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
        <Slot {...toSlotProps(passthrough)} {...behaviorProps} ref={ref}>
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
