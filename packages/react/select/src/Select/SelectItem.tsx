import { useActivationGuard, useFocusNode } from "@lattice-ui/react-focus";
import { composeEvents, composeRefs, getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import { SelectItemContextProvider, useSelectContext } from "./context";
import type { SelectItemProps } from "./types";

const OWN_PROPS = ["value", "textValue", "disabled", "asChild", "children"] as const;

// See SelectTrigger: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  AutoButtonColor: false,
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

let nextItemId = 0;
let nextItemOrder = 0;

export function SelectItem(props: SelectItemProps) {
  const selectContext = useSelectContext();
  const disabled = selectContext.disabled || props.disabled === true;
  const textValue = props.textValue ?? props.value;

  const disabledRef = React.useRef(disabled);
  const textValueRef = React.useRef(textValue);
  const itemRef = React.useRef<GuiObject>();

  const [highlighted, setHighlighted] = React.useState(false);

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

  useFocusNode({
    ref: itemRef,
    getDisabled: () => disabledRef.current,
  });

  const claimActivation = useActivationGuard();

  // `Activated` and the `Return`/`Space` `InputBegan` branch share this guarded
  // path: a gamepad/keyboard selection fires both events, and the guard keeps
  // the selection from being committed twice.
  const handleSelect = React.useCallback(() => {
    if (disabled || !claimActivation()) {
      return;
    }

    selectContext.setValue(props.value);
    selectContext.setOpen(false);
  }, [claimActivation, disabled, props.value, selectContext]);

  const handleInputBegan = React.useCallback(
    (_rbx: GuiObject, inputObject: InputObject) => {
      const keyCode = inputObject.KeyCode;
      if (keyCode !== Enum.KeyCode.Return && keyCode !== Enum.KeyCode.Space) {
        return;
      }

      handleSelect();
    },
    [handleSelect],
  );

  // Pointer and gamepad/keyboard focus both feed the same flag, so a controller-driven selection
  // highlights exactly like a hover does.
  const handlePointerEnter = React.useCallback(() => setHighlighted(true), []);
  const handlePointerLeave = React.useCallback(() => setHighlighted(false), []);

  const ownEvents = React.useMemo(
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
    itemRef.current = instance?.IsA("GuiObject") ? instance : undefined;
  }, []);

  // Highlight is tracked, never painted: consumers read it here and style however they like.
  const itemContextValue = React.useMemo(
    () => ({
      highlighted: highlighted && !disabled,
      disabled,
    }),
    [disabled, highlighted],
  );

  const passthrough = getPassthroughProps<TextButton>(props, OWN_PROPS);
  const behaviorProps = {
    Active: !disabled,
    Event: composeEvents(passthrough.Event, ownEvents),
    Selectable: !disabled,
    ref: composeRefs<Instance>(passthrough.ref as never, setItemRef),
  };

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[SelectItem] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return (
      <SelectItemContextProvider value={itemContextValue}>
        <Slot {...toSlotProps(passthrough)} {...behaviorProps}>
          {child}
        </Slot>
      </SelectItemContextProvider>
    );
  }

  return (
    <SelectItemContextProvider value={itemContextValue}>
      <textbutton {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps}>
        {props.children}
      </textbutton>
    </SelectItemContextProvider>
  );
}
