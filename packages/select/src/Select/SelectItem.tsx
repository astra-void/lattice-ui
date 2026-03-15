import { React, Slot } from "@lattice-ui/core";
import { useSelectContext } from "./context";
import type { SelectItemProps } from "./types";

let nextItemId = 0;
let nextItemOrder = 0;

export function SelectItem(props: SelectItemProps) {
  const selectContext = useSelectContext();
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
      getDisabled: () => disabledRef.current,
      getTextValue: () => textValueRef.current,
    });
  }, [props.value, selectContext]);

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
      <Slot Active={!disabled} Event={eventHandlers} Selectable={false}>
        {child}
      </Slot>
    );
  }

  return (
    <textbutton
      Active={!disabled}
      AutoButtonColor={false}
      BackgroundColor3={Color3.fromRGB(47, 53, 68)}
      BorderSizePixel={0}
      Event={eventHandlers}
      Selectable={false}
      Size={UDim2.fromOffset(220, 32)}
      Text={textValue}
      TextColor3={disabled ? Color3.fromRGB(134, 141, 156) : Color3.fromRGB(234, 239, 247)}
      TextSize={15}
      TextXAlignment={Enum.TextXAlignment.Left}
    >
      <uipadding PaddingLeft={new UDim(0, 10)} PaddingRight={new UDim(0, 10)} />
      {props.children}
    </textbutton>
  );
}
