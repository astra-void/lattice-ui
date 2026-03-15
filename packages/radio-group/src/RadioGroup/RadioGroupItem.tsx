import { React, Slot } from "@lattice-ui/core";
import { RadioGroupItemContextProvider, useRadioGroupContext } from "./context";
import type { RadioGroupItemProps } from "./types";

let nextItemId = 0;
let nextItemOrder = 0;

export function RadioGroupItem(props: RadioGroupItemProps) {
  const radioGroupContext = useRadioGroupContext();
  const disabled = radioGroupContext.disabled || props.disabled === true;
  const checked = radioGroupContext.value === props.value;
  const itemRef = React.useRef<GuiObject>();
  const disabledRef = React.useRef(disabled);

  React.useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

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
    return radioGroupContext.registerItem({
      id: itemIdRef.current,
      value: props.value,
      order: itemOrderRef.current,
      ref: itemRef,
      getDisabled: () => disabledRef.current,
    });
  }, [props.value, radioGroupContext]);

  const setItemRef = React.useCallback((instance: Instance | undefined) => {
    if (!instance || !instance.IsA("GuiObject")) {
      itemRef.current = undefined;
      return;
    }

    itemRef.current = instance;
  }, []);

  const handleSelect = React.useCallback(() => {
    if (disabled) {
      return;
    }

    radioGroupContext.setValue(props.value);
  }, [disabled, props.value, radioGroupContext]);

  const handleSelectionGained = React.useCallback(() => {
    if (disabled) {
      return;
    }

    radioGroupContext.setValue(props.value);
  }, [disabled, props.value, radioGroupContext]);

  const handleInputBegan = React.useCallback(
    (_rbx: GuiObject, inputObject: InputObject) => {
      if (disabled) {
        return;
      }

      const keyCode = inputObject.KeyCode;
      const direction =
        radioGroupContext.orientation === "horizontal"
          ? keyCode === Enum.KeyCode.Left
            ? -1
            : keyCode === Enum.KeyCode.Right
              ? 1
              : undefined
          : keyCode === Enum.KeyCode.Up
            ? -1
            : keyCode === Enum.KeyCode.Down
              ? 1
              : undefined;

      if (direction !== undefined) {
        radioGroupContext.moveSelection(props.value, direction);
        return;
      }

      if (keyCode !== Enum.KeyCode.Return && keyCode !== Enum.KeyCode.Space) {
        return;
      }

      radioGroupContext.setValue(props.value);
    },
    [disabled, props.value, radioGroupContext],
  );

  const eventHandlers = React.useMemo(
    () => ({
      Activated: handleSelect,
      InputBegan: handleInputBegan,
      SelectionGained: handleSelectionGained,
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
            <Slot Active={!disabled} Event={eventHandlers} Selectable={!disabled} ref={setItemRef}>
              {child}
            </Slot>
          );
        })()
      ) : (
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
          ref={setItemRef}
        >
          {props.children}
        </textbutton>
      )}
    </RadioGroupItemContextProvider>
  );
}
