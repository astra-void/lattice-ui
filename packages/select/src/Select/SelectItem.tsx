import { React, Slot } from "@lattice-ui/core";
import { RovingFocusItem } from "@lattice-ui/focus";
import { useSelectContext } from "./context";
import type { SelectItemProps } from "./types";

let nextItemId = 0;
let nextItemOrder = 0;

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

export function SelectItem(props: SelectItemProps) {
  const selectContext = useSelectContext();
  const itemRef = React.useRef<GuiObject>();

  const disabled = selectContext.disabled || props.disabled === true;
  const textValue = props.textValue ?? props.value;

  const disabledRef = React.useRef(disabled);
  const textValueRef = React.useRef(textValue);

  React.useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  React.useEffect(() => {
    textValueRef.current = textValue;
  }, [textValue]);

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
    return selectContext.registerItem({
      id: itemIdRef.current,
      value: props.value,
      order: itemOrderRef.current,
      getNode: () => itemRef.current,
      getDisabled: () => disabledRef.current,
      getTextValue: () => textValueRef.current,
    });
  }, [props.value, selectContext]);

  const setItemRef = React.useCallback((instance: Instance | undefined) => {
    itemRef.current = toGuiObject(instance);
  }, []);

  const handleSelect = React.useCallback(() => {
    if (disabled) {
      return;
    }

    selectContext.setValue(props.value);
    selectContext.setOpen(false);
  }, [disabled, props.value, selectContext]);

  const handleInputBegan = React.useCallback(
    (_rbx: GuiObject, inputObject: InputObject) => {
      if (disabled) {
        return;
      }

      const keyCode = inputObject.KeyCode;
      if (keyCode !== Enum.KeyCode.Return && keyCode !== Enum.KeyCode.Space) {
        return;
      }

      selectContext.setValue(props.value);
      selectContext.setOpen(false);
    },
    [disabled, props.value, selectContext],
  );

  const eventHandlers = React.useMemo(
    () => ({
      Activated: handleSelect,
      InputBegan: handleInputBegan,
    }),
    [handleInputBegan, handleSelect],
  );

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[SelectItem] `asChild` requires a child element.");
    }

    return (
      <RovingFocusItem asChild disabled={disabled}>
        <Slot Active={!disabled} Event={eventHandlers} Selectable={!disabled} ref={setItemRef}>
          {child}
        </Slot>
      </RovingFocusItem>
    );
  }

  return (
    <RovingFocusItem asChild disabled={disabled}>
      <textbutton
        Active={!disabled}
        AutoButtonColor={false}
        BackgroundColor3={Color3.fromRGB(47, 53, 68)}
        BorderSizePixel={0}
        Event={eventHandlers}
        Selectable={!disabled}
        Size={UDim2.fromOffset(220, 32)}
        Text={textValue}
        TextColor3={disabled ? Color3.fromRGB(134, 141, 156) : Color3.fromRGB(234, 239, 247)}
        TextSize={15}
        TextXAlignment={Enum.TextXAlignment.Left}
        ref={setItemRef}
      >
        <uipadding PaddingLeft={new UDim(0, 10)} PaddingRight={new UDim(0, 10)} />
        {props.children}
      </textbutton>
    </RovingFocusItem>
  );
}
