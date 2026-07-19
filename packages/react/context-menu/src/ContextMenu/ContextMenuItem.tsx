import { createSelectionResponseRecipe, useResponseMotion } from "@lattice-ui/react-motion";
import { React, Slot } from "@lattice-ui/react-runtime";
import { useContextMenuContext } from "./context";
import type { ContextMenuItemProps, ContextMenuSelectEvent } from "./types";

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

  const [active, setActive] = React.useState(false);

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
      const nextItem = !instance?.IsA("GuiObject") ? undefined : instance;
      itemRef.current = nextItem;
      motionRef.current = nextItem;
    },
    [motionRef],
  );

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

  const handlePointerEnter = React.useCallback(() => setActive(true), []);
  const handlePointerLeave = React.useCallback(() => setActive(false), []);

  const eventHandlers = React.useMemo(
    () => ({
      Activated: handleActivated,
      MouseEnter: handlePointerEnter,
      MouseLeave: handlePointerLeave,
    }),
    [handleActivated, handlePointerEnter, handlePointerLeave],
  );

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ContextMenuItem] `asChild` requires a child element.");
    }

    return (
      <Slot Active={props.disabled !== true} Event={eventHandlers} ref={setItemRef}>
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
