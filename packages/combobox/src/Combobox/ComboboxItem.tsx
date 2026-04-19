import { React, Slot } from "@lattice-ui/core";
import { useComboboxContext } from "./context";
import type { ComboboxItemProps } from "./types";

let nextItemId = 0;
let nextItemOrder = 0;

export function ComboboxItem(props: ComboboxItemProps) {
  const comboboxContext = useComboboxContext();
  const textValue = props.textValue ?? props.value;
  const itemQueryMatch = comboboxContext.filterFn(textValue, comboboxContext.queryValue);
  const disabled = comboboxContext.disabled || props.disabled === true;
  const interactionDisabled = disabled || !itemQueryMatch;

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

  const registerItem = comboboxContext.registerItem;

  React.useEffect(() => {
    return registerItem({
      id: itemIdRef.current,
      value: props.value,
      order: itemOrderRef.current,
      getDisabled: () => disabledRef.current,
      getTextValue: () => textValueRef.current,
    });
  }, [registerItem, props.value]);

  const handleSelect = React.useCallback(() => {
    if (interactionDisabled) {
      return;
    }

    comboboxContext.setValue(props.value);
    comboboxContext.setOpen(false);
  }, [comboboxContext, interactionDisabled, props.value]);

  const handleInputBegan = React.useCallback(
    (_rbx: GuiObject, inputObject: InputObject) => {
      if (interactionDisabled) {
        return;
      }

      const keyCode = inputObject.KeyCode;
      if (keyCode !== Enum.KeyCode.Return && keyCode !== Enum.KeyCode.Space) {
        return;
      }

      comboboxContext.setValue(props.value);
      comboboxContext.setOpen(false);
    },
    [comboboxContext, interactionDisabled, props.value],
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
      error("[ComboboxItem] `asChild` requires a child element.");
    }

    return (
      <Slot Active={!interactionDisabled} Event={eventHandlers} Selectable={false} Visible={itemQueryMatch}>
        {child}
      </Slot>
    );
  }

  return (
    <textbutton
      Active={!interactionDisabled}
      AutoButtonColor={false}
      BackgroundColor3={Color3.fromRGB(47, 53, 68)}
      BorderSizePixel={0}
      Event={eventHandlers}
      Selectable={false}
      Size={UDim2.fromOffset(220, 32)}
      Text={textValue}
      TextColor3={interactionDisabled ? Color3.fromRGB(134, 141, 156) : Color3.fromRGB(234, 239, 247)}
      TextSize={15}
      TextXAlignment={Enum.TextXAlignment.Left}
      Visible={itemQueryMatch}
    >
      <uipadding PaddingLeft={new UDim(0, 10)} PaddingRight={new UDim(0, 10)} />
      {props.children}
    </textbutton>
  );
}
