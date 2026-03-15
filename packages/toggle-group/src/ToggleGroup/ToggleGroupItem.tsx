import { React, Slot } from "@lattice-ui/core";
import { useToggleGroupContext } from "./context";
import type { ToggleGroupItemProps } from "./types";

export function ToggleGroupItem(props: ToggleGroupItemProps) {
  const toggleGroupContext = useToggleGroupContext();
  const disabled = toggleGroupContext.disabled || props.disabled === true;
  const pressed = toggleGroupContext.isPressed(props.value);

  const handleToggle = React.useCallback(() => {
    if (disabled) {
      return;
    }

    toggleGroupContext.toggleValue(props.value);
  }, [disabled, props.value, toggleGroupContext]);

  const handleInputBegan = React.useCallback(
    (_rbx: TextButton, inputObject: InputObject) => {
      if (disabled) {
        return;
      }

      const keyCode = inputObject.KeyCode;
      if (keyCode !== Enum.KeyCode.Return && keyCode !== Enum.KeyCode.Space) {
        return;
      }

      toggleGroupContext.toggleValue(props.value);
    },
    [disabled, props.value, toggleGroupContext],
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
      <Slot Active={!disabled} Event={eventHandlers} Selectable={false}>
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
      Selectable={false}
      Size={UDim2.fromOffset(170, 34)}
      Text={props.value}
      TextColor3={disabled ? Color3.fromRGB(139, 146, 160) : Color3.fromRGB(236, 241, 249)}
      TextSize={15}
    >
      {props.children}
    </textbutton>
  );
}
