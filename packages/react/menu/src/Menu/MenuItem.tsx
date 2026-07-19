import { useFocusNode } from "@lattice-ui/react-focus";
import { composeEvents, composeRefs, getPassthroughProps, React, Slot } from "@lattice-ui/react-runtime";
import { MenuItemContextProvider, useMenuContext } from "./context";
import type { MenuItemProps, MenuSelectEvent } from "./types";

const OWN_PROPS = ["asChild", "disabled", "onSelect", "children"] as const;

// See MenuTrigger: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  AutoButtonColor: false,
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

let nextItemId = 0;
let nextItemOrder = 0;

function createMenuSelectEvent(): MenuSelectEvent {
  const event: MenuSelectEvent = {
    defaultPrevented: false,
    preventDefault: () => {
      event.defaultPrevented = true;
    },
  };

  return event;
}

export function MenuItem(props: MenuItemProps) {
  const menuContext = useMenuContext();
  const itemRef = React.useRef<GuiObject>();
  const disabledRef = React.useRef(props.disabled === true);

  const [highlighted, setHighlighted] = React.useState(false);

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

  React.useEffect(() => {
    return menuContext.registerItem({
      id: itemIdRef.current,
      order: itemOrderRef.current,
      ref: itemRef,
      getDisabled: () => disabledRef.current,
    });
  }, [menuContext]);

  useFocusNode({
    ref: itemRef,
    getDisabled: () => disabledRef.current,
  });

  const setItemRef = React.useCallback((instance: Instance | undefined) => {
    itemRef.current = !instance?.IsA("GuiObject") ? undefined : instance;
  }, []);

  const handleActivated = React.useCallback(() => {
    if (props.disabled) {
      return;
    }

    const event = createMenuSelectEvent();
    props.onSelect?.(event);

    if (!event.defaultPrevented) {
      menuContext.setOpen(false);
    }
  }, [menuContext, props.disabled, props.onSelect]);

  const handleInputBegan = React.useCallback(
    (_rbx: GuiObject, inputObject: InputObject) => {
      if (props.disabled) {
        return;
      }

      // Directional movement between items is owned by the focus navigation
      // controller (the MenuContent FocusScope is an ordered vertical scope).
      const keyCode = inputObject.KeyCode;
      if (keyCode === Enum.KeyCode.Return || keyCode === Enum.KeyCode.Space) {
        handleActivated();
      }
    },
    [handleActivated, props.disabled],
  );

  const handlePointerEnter = React.useCallback(() => setHighlighted(true), []);
  const handlePointerLeave = React.useCallback(() => setHighlighted(false), []);

  const ownEvents = React.useMemo(
    () => ({
      Activated: handleActivated,
      InputBegan: handleInputBegan,
      MouseEnter: handlePointerEnter,
      MouseLeave: handlePointerLeave,
      SelectionGained: handlePointerEnter,
      SelectionLost: handlePointerLeave,
    }),
    [handleActivated, handleInputBegan, handlePointerEnter, handlePointerLeave],
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
    Selectable: !disabled,
  };
  const ref = composeRefs<Instance>(passthrough.ref as never, setItemRef);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[MenuItem] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return (
      <MenuItemContextProvider value={itemContextValue}>
        <Slot {...passthrough} {...behaviorProps} ref={ref}>
          {child}
        </Slot>
      </MenuItemContextProvider>
    );
  }

  return (
    <MenuItemContextProvider value={itemContextValue}>
      <textbutton {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps} ref={ref as never}>
        {props.children}
      </textbutton>
    </MenuItemContextProvider>
  );
}
