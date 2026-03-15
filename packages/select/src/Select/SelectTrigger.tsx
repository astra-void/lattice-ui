import { React, Slot } from "@lattice-ui/core";
import { useSelectContext } from "./context";
import type { SelectTriggerProps } from "./types";

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

export function SelectTrigger(props: SelectTriggerProps) {
  const selectContext = useSelectContext();
  const disabled = selectContext.disabled || props.disabled === true;

  const setTriggerRef = React.useCallback(
    (instance: Instance | undefined) => {
      selectContext.triggerRef.current = toGuiObject(instance);
    },
    [selectContext.triggerRef],
  );

  const handleActivated = React.useCallback(() => {
    if (disabled) {
      return;
    }

    selectContext.setOpen(!selectContext.open);
  }, [disabled, selectContext]);

  const handleInputBegan = React.useCallback(
    (_rbx: GuiObject, inputObject: InputObject) => {
      if (disabled) {
        return;
      }

      const keyCode = inputObject.KeyCode;
      if (keyCode === Enum.KeyCode.Return || keyCode === Enum.KeyCode.Space) {
        selectContext.setOpen(!selectContext.open);
      }
    },
    [disabled, selectContext],
  );

  const eventHandlers = React.useMemo(
    () => ({
      Activated: handleActivated,
      InputBegan: handleInputBegan,
    }),
    [handleActivated, handleInputBegan],
  );

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[SelectTrigger] `asChild` requires a child element.");
    }

    return (
      <Slot Active={!disabled} Event={eventHandlers} Selectable={false} ref={setTriggerRef}>
        {child}
      </Slot>
    );
  }

  return (
    <textbutton
      Active={!disabled}
      AutoButtonColor={false}
      BackgroundColor3={Color3.fromRGB(41, 48, 63)}
      BorderSizePixel={0}
      Event={eventHandlers}
      Selectable={false}
      Size={UDim2.fromOffset(220, 36)}
      Text="Select"
      TextColor3={disabled ? Color3.fromRGB(140, 148, 164) : Color3.fromRGB(235, 241, 248)}
      TextSize={15}
      ref={setTriggerRef}
    >
      {props.children}
    </textbutton>
  );
}
