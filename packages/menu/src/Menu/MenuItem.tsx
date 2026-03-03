import { React, Slot } from "@lattice-ui/core";
import { RovingFocusItem } from "@lattice-ui/focus";
import { useMenuContext } from "./context";
import type { MenuItemProps, MenuSelectEvent } from "./types";

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

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[MenuItem] `asChild` requires a child element.");
    }

    return (
      <RovingFocusItem asChild disabled={props.disabled}>
        <Slot
          Active={props.disabled !== true}
          Event={{ Activated: handleActivated }}
          Selectable={props.disabled !== true}
        >
          {child}
        </Slot>
      </RovingFocusItem>
    );
  }

  return (
    <RovingFocusItem asChild disabled={props.disabled}>
      <textbutton
        Active={props.disabled !== true}
        AutoButtonColor={false}
        BackgroundColor3={Color3.fromRGB(47, 53, 68)}
        BorderSizePixel={0}
        Event={{ Activated: handleActivated }}
        Selectable={props.disabled !== true}
        Size={UDim2.fromOffset(220, 34)}
        Text="Menu Item"
        TextColor3={props.disabled ? Color3.fromRGB(135, 142, 156) : Color3.fromRGB(234, 239, 247)}
        TextSize={15}
        TextXAlignment={Enum.TextXAlignment.Left}
      >
        <uipadding PaddingLeft={new UDim(0, 10)} PaddingRight={new UDim(0, 10)} />
        {props.children}
      </textbutton>
    </RovingFocusItem>
  );
}
