import { React, Slot } from "@lattice-ui/core";
import { RovingFocusItem } from "@lattice-ui/focus";
import { RadioGroupItemContextProvider, useRadioGroupContext } from "./context";
import type { RadioGroupItemProps } from "./types";

export function RadioGroupItem(props: RadioGroupItemProps) {
  const radioGroupContext = useRadioGroupContext();
  const disabled = radioGroupContext.disabled || props.disabled === true;
  const checked = radioGroupContext.value === props.value;

  const handleSelect = React.useCallback(() => {
    if (disabled) {
      return;
    }

    radioGroupContext.setValue(props.value);
  }, [disabled, props.value, radioGroupContext]);

  const handleInputBegan = React.useCallback(
    (_rbx: TextButton, inputObject: InputObject) => {
      if (disabled) {
        return;
      }

      const keyCode = inputObject.KeyCode;
      if (keyCode !== Enum.KeyCode.Return && keyCode !== Enum.KeyCode.Space) {
        return;
      }

      radioGroupContext.setValue(props.value);
    },
    [disabled, props.value, radioGroupContext],
  );

  const handleSelectionGained = React.useCallback(() => {
    if (!radioGroupContext.keyboardNavigation) {
      return;
    }

    handleSelect();
  }, [handleSelect, radioGroupContext.keyboardNavigation]);

  const eventHandlers = React.useMemo(
    () => ({
      Activated: handleSelect,
      SelectionGained: handleSelectionGained,
      InputBegan: handleInputBegan,
    }),
    [handleInputBegan, handleSelect, handleSelectionGained],
  );

  const itemContextValue = React.useMemo(
    () => ({
      checked,
      disabled,
    }),
    [checked, disabled],
  );

  return (
    <RadioGroupItemContextProvider value={itemContextValue}>
      {props.asChild ? (
        (() => {
          const child = props.children;
          if (!child) {
            error("[RadioGroupItem] `asChild` requires a child element.");
          }

          return (
            <RovingFocusItem asChild disabled={disabled}>
              <Slot Active={!disabled} Event={eventHandlers} Selectable={!disabled}>
                {child}
              </Slot>
            </RovingFocusItem>
          );
        })()
      ) : (
        <RovingFocusItem asChild disabled={disabled}>
          <textbutton
            Active={!disabled}
            AutoButtonColor={false}
            BackgroundColor3={checked ? Color3.fromRGB(88, 142, 255) : Color3.fromRGB(47, 53, 68)}
            BorderSizePixel={0}
            Event={eventHandlers}
            Selectable={!disabled}
            Size={UDim2.fromOffset(170, 34)}
            Text={props.value}
            TextColor3={disabled ? Color3.fromRGB(139, 146, 160) : Color3.fromRGB(236, 241, 249)}
            TextSize={15}
          >
            {props.children}
          </textbutton>
        </RovingFocusItem>
      )}
    </RadioGroupItemContextProvider>
  );
}
