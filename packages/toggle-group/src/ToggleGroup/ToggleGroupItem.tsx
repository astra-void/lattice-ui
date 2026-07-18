import { React, Slot } from "@lattice-ui/core";
import { useActivationGuard, useFocusNode } from "@lattice-ui/focus";
import { createSelectionResponseRecipe, useResponseMotion } from "@lattice-ui/motion";
import { useToggleGroupContext } from "./context";
import type { ToggleGroupItemProps } from "./types";

export function ToggleGroupItem(props: ToggleGroupItemProps) {
  const toggleGroupContext = useToggleGroupContext();
  const disabled = toggleGroupContext.disabled || props.disabled === true;
  const pressed = toggleGroupContext.isPressed(props.value);
  const itemRef = React.useRef<GuiObject>();
  const motionRef = useResponseMotion<GuiObject>(
    pressed,
    {
      active: { BackgroundColor3: Color3.fromRGB(88, 142, 255), TextColor3: Color3.fromRGB(236, 241, 249) },
      inactive: { BackgroundColor3: Color3.fromRGB(47, 53, 68), TextColor3: Color3.fromRGB(139, 146, 160) },
    },
    props.transition ?? createSelectionResponseRecipe(),
  );

  const setItemRef = React.useCallback(
    (instance: Instance | undefined) => {
      const nextItem = instance?.IsA("GuiObject") ? instance : undefined;
      itemRef.current = nextItem;
      motionRef.current = nextItem;
    },
    [motionRef],
  );

  useFocusNode({
    ref: itemRef,
    disabled,
  });

  const claimActivation = useActivationGuard();

  // `Activated` and the `Return`/`Space` `InputBegan` branch share this guarded
  // path so one gamepad/keyboard activation — which fires both — toggles the
  // item once rather than flipping it and immediately flipping it back.
  const handleToggle = React.useCallback(() => {
    if (disabled || !claimActivation()) {
      return;
    }

    toggleGroupContext.toggleValue(props.value);
  }, [claimActivation, disabled, props.value, toggleGroupContext]);

  const handleInputBegan = React.useCallback(
    (_rbx: TextButton, inputObject: InputObject) => {
      const keyCode = inputObject.KeyCode;
      if (keyCode !== Enum.KeyCode.Return && keyCode !== Enum.KeyCode.Space) {
        return;
      }

      handleToggle();
    },
    [handleToggle],
  );

  const eventHandlers = React.useMemo(
    () => ({
      Activated: handleToggle,
      InputBegan: handleInputBegan,
    }),
    [handleInputBegan, handleToggle],
  );

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ToggleGroupItem] `asChild` requires a child element.");
    }

    return (
      <Slot Active={!disabled} Event={eventHandlers} Selectable={!disabled} ref={setItemRef}>
        {child}
      </Slot>
    );
  }

  return (
    <textbutton
      Active={!disabled}
      AutoButtonColor={false}
      BackgroundColor3={pressed ? Color3.fromRGB(88, 142, 255) : Color3.fromRGB(47, 53, 68)}
      BorderSizePixel={0}
      Event={eventHandlers}
      Selectable={!disabled}
      Size={UDim2.fromOffset(170, 34)}
      Text={props.value}
      TextColor3={
        pressed
          ? Color3.fromRGB(236, 241, 249)
          : disabled
            ? Color3.fromRGB(139, 146, 160)
            : Color3.fromRGB(236, 241, 249)
      }
      TextSize={15}
      ref={setItemRef}
    >
      {props.children}
    </textbutton>
  );
}
