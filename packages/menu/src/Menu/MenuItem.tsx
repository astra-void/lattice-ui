import { React, Slot } from "@lattice-ui/core";
import { useFocusNode } from "@lattice-ui/focus";
import { createSelectionResponseRecipe, useResponseMotion } from "@lattice-ui/motion";
import { useMenuContext } from "./context";
import type { MenuItemProps, MenuSelectEvent } from "./types";

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

  const [active, setActive] = React.useState(false);

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

  const motionRef = useResponseMotion<GuiObject>(
    active && props.disabled !== true,
    {
      active: { BackgroundColor3: Color3.fromRGB(39, 46, 61) },
      inactive: { BackgroundColor3: Color3.fromRGB(47, 53, 68) },
    },
    createSelectionResponseRecipe(),
  );

  const setItemRef = React.useCallback(
    (instance: Instance | undefined) => {
      const nextItem = !instance || !instance.IsA("GuiObject") ? undefined : instance;
      itemRef.current = nextItem;
      motionRef.current = nextItem;
    },
    [motionRef],
  );

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

      const keyCode = inputObject.KeyCode;
      if (keyCode === Enum.KeyCode.Up || keyCode === Enum.KeyCode.Down) {
        menuContext.moveSelection(keyCode === Enum.KeyCode.Up ? -1 : 1);
        return;
      }

      if (keyCode === Enum.KeyCode.Return || keyCode === Enum.KeyCode.Space) {
        handleActivated();
      }
    },
    [handleActivated, menuContext, props.disabled],
  );

  const handlePointerEnter = React.useCallback(() => setActive(true), []);
  const handlePointerLeave = React.useCallback(() => setActive(false), []);

  const eventHandlers = React.useMemo(
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

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[MenuItem] `asChild` requires a child element.");
    }

    return (
      <Slot
        Active={props.disabled !== true}
        Event={eventHandlers}
        Selectable={props.disabled !== true}
        ref={setItemRef}
      >
        {child}
      </Slot>
    );
  }

  return (
    <textbutton
      Active={props.disabled !== true}
      AutoButtonColor={false}
      BackgroundColor3={active && props.disabled !== true ? Color3.fromRGB(66, 73, 91) : Color3.fromRGB(47, 53, 68)}
      BorderSizePixel={0}
      Event={eventHandlers}
      Selectable={props.disabled !== true}
      Size={UDim2.fromOffset(220, 34)}
      Text="Menu Item"
      TextColor3={props.disabled ? Color3.fromRGB(135, 142, 156) : Color3.fromRGB(234, 239, 247)}
      TextSize={15}
      TextXAlignment={Enum.TextXAlignment.Left}
      ref={setItemRef}
    >
      <uipadding PaddingLeft={new UDim(0, 10)} PaddingRight={new UDim(0, 10)} />
      {props.children}
    </textbutton>
  );
}
