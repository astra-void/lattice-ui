import { React, Slot } from "@lattice-ui/core";
import { buildTweenTransition, useStateMotion } from "@lattice-ui/motion";
import { useSelectContext } from "./context";
import type { SelectItemProps } from "./types";

let nextItemId = 0;
let nextItemOrder = 0;

const transition = buildTweenTransition(
  { BackgroundColor3: Color3.fromRGB(66, 73, 91) },
  { BackgroundColor3: Color3.fromRGB(47, 53, 68) },
);

export function SelectItem(props: SelectItemProps) {
  const selectContext = useSelectContext();
  const disabled = selectContext.disabled || props.disabled === true;
  const textValue = props.textValue ?? props.value;

  const disabledRef = React.useRef(disabled);
  const textValueRef = React.useRef(textValue);

  const [active, setActive] = React.useState(false);
  const itemRef = React.useRef<GuiObject>();

  const __motionRef = useStateMotion<GuiObject>(active && !disabled, transition, false);
  React.useLayoutEffect(() => {
    if (__motionRef.current && itemRef.current !== __motionRef.current) {
      itemRef.current = __motionRef.current as GuiObject;
    }
  }, [__motionRef]);

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

  const registerItem = selectContext.registerItem;

  React.useEffect(() => {
    return registerItem({
      id: itemIdRef.current,
      value: props.value,
      order: itemOrderRef.current,
      getDisabled: () => disabledRef.current,
      getTextValue: () => textValueRef.current,
    });
  }, [props.value, registerItem]);

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

  const handlePointerEnter = React.useCallback(() => setActive(true), []);
  const handlePointerLeave = React.useCallback(() => setActive(false), []);

  const eventHandlers = React.useMemo(
    () => ({
      Activated: handleSelect,
      InputBegan: handleInputBegan,
      MouseEnter: handlePointerEnter,
      MouseLeave: handlePointerLeave,
      SelectionGained: handlePointerEnter,
      SelectionLost: handlePointerLeave,
    }),
    [handleInputBegan, handleSelect, handlePointerEnter, handlePointerLeave],
  );

  const setItemRef = React.useCallback((instance: Instance | undefined) => {
    if (!instance || !instance.IsA("GuiObject")) {
      itemRef.current = undefined;
      return;
    }
    itemRef.current = instance;
  }, []);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[SelectItem] `asChild` requires a child element.");
    }

    return (
      <Slot Active={!disabled} Event={eventHandlers} Selectable={false} ref={setItemRef}>
        {child}
      </Slot>
    );
  }

  return (
    <textbutton
      Active={!disabled}
      AutoButtonColor={false}
      BackgroundColor3={active && !disabled ? Color3.fromRGB(66, 73, 91) : Color3.fromRGB(47, 53, 68)}
      BorderSizePixel={0}
      Event={eventHandlers}
      Selectable={false}
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
  );
}
