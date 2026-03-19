import { focusGuiObject, React, Slot, useFocusNode } from "@lattice-ui/core";
import { useMenuContext } from "./context";
import type { MenuTriggerProps } from "./types";

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

export function MenuTrigger(props: MenuTriggerProps) {
  const menuContext = useMenuContext();
  const triggerRef = menuContext.triggerRef;

  const setTriggerRef = React.useCallback(
    (instance: Instance | undefined) => {
      triggerRef.current = toGuiObject(instance);
    },
    [triggerRef],
  );

  useFocusNode({
    ref: triggerRef,
    disabled: props.disabled === true,
  });

  const handleActivated = React.useCallback(() => {
    if (props.disabled) {
      return;
    }

    if (!menuContext.open) {
      focusGuiObject(triggerRef.current);
    }

    menuContext.setOpen(!menuContext.open);
  }, [menuContext.open, menuContext.setOpen, props.disabled, triggerRef]);

  const handleInputBegan = React.useCallback(
    (_rbx: GuiObject, inputObject: InputObject) => {
      if (props.disabled) {
        return;
      }

      const keyCode = inputObject.KeyCode;
      if (keyCode === Enum.KeyCode.Return || keyCode === Enum.KeyCode.Space) {
        if (!menuContext.open) {
          focusGuiObject(triggerRef.current);
        }

        menuContext.setOpen(!menuContext.open);
      }
    },
    [menuContext.open, menuContext.setOpen, props.disabled, triggerRef],
  );

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[MenuTrigger] `asChild` requires a child element.");
    }

    return (
      <Slot
        Active={props.disabled !== true}
        Event={{ Activated: handleActivated, InputBegan: handleInputBegan }}
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
      Event={{ Activated: handleActivated, InputBegan: handleInputBegan }}
      Selectable={props.disabled !== true}
      Size={UDim2.fromOffset(140, 38)}
      Text="Toggle Menu"
      TextColor3={Color3.fromRGB(240, 244, 250)}
      TextSize={16}
      ref={setTriggerRef}
    >
      {props.children}
    </textbutton>
  );
}
