import { React, Slot } from "@lattice-ui/core";
import { useComboboxContext } from "./context";
import type { ComboboxTriggerProps } from "./types";

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

export function ComboboxTrigger(props: ComboboxTriggerProps) {
  const comboboxContext = useComboboxContext();
  const disabled = comboboxContext.disabled || props.disabled === true;

  const setTriggerRef = React.useCallback(
    (instance: Instance | undefined) => {
      comboboxContext.triggerRef.current = toGuiObject(instance);
    },
    [comboboxContext.triggerRef],
  );

  const handleActivated = React.useCallback(() => {
    if (disabled) {
      return;
    }

    comboboxContext.setOpen(!comboboxContext.open);
  }, [comboboxContext, disabled]);

  const handleInputBegan = React.useCallback(
    (_rbx: GuiObject, inputObject: InputObject) => {
      if (disabled) {
        return;
      }

      const keyCode = inputObject.KeyCode;
      if (keyCode === Enum.KeyCode.Return || keyCode === Enum.KeyCode.Space) {
        comboboxContext.setOpen(!comboboxContext.open);
        return;
      }

      if (keyCode === Enum.KeyCode.Down || keyCode === Enum.KeyCode.Up) {
        comboboxContext.setOpen(true);
      }
    },
    [comboboxContext, disabled],
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
      error("[ComboboxTrigger] `asChild` requires a child element.");
    }

    return (
      <Slot Active={!disabled} Event={eventHandlers} Selectable={!disabled} ref={setTriggerRef}>
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
      Selectable={!disabled}
      Size={UDim2.fromOffset(220, 36)}
      Text="Combobox"
      TextColor3={disabled ? Color3.fromRGB(140, 148, 164) : Color3.fromRGB(235, 241, 248)}
      TextSize={15}
      ref={setTriggerRef}
    >
      {props.children}
    </textbutton>
  );
}
