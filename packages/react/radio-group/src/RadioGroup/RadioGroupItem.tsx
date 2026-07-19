import { useFocusNode } from "@lattice-ui/react-focus";
import { composeEvents, composeRefs, getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import { RadioGroupItemContextProvider, useRadioGroupContext } from "./context";
import type { RadioGroupItemProps } from "./types";

const OWN_PROPS = ["value", "disabled", "asChild", "children"] as const;

// Roblox instance defaults are themselves a look: a bare `textbutton` renders an opaque grey box
// labelled "Button". Neutralize only that, and leave every real appearance decision (colors, size,
// fonts, text) to the consumer. Passthrough props are spread after these, so they stay overridable.
const NEUTRAL_PROPS = {
  AutoButtonColor: false,
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

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

  useFocusNode({
    ref: itemRef,
    getDisabled: () => disabledRef.current,
  });

  const setItemRef = React.useCallback((instance: Instance | undefined) => {
    itemRef.current = !instance?.IsA("GuiObject") ? undefined : instance;
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

  const itemContextValue = React.useMemo(
    () => ({
      checked,
      disabled,
    }),
    [checked, disabled],
  );

  const passthrough = getPassthroughProps<TextButton>(props, OWN_PROPS);
  const behaviorProps = {
    Active: !disabled,
    Event: composeEvents(passthrough.Event, {
      Activated: handleSelect,
      InputBegan: handleInputBegan,
      SelectionGained: handleSelectionGained,
    }),
    Selectable: !disabled,
  };
  const ref = composeRefs<GuiObject>(passthrough.ref as never, setItemRef);

  return (
    <RadioGroupItemContextProvider value={itemContextValue}>
      {props.asChild ? (
        (() => {
          const child = props.children;
          if (!child) {
            error("[RadioGroupItem] `asChild` requires a child element.");
          }

          // No neutral defaults here: the rendered element belongs to the consumer.
          return (
            <Slot {...toSlotProps(passthrough)} {...behaviorProps} ref={ref as never}>
              {child}
            </Slot>
          );
        })()
      ) : (
        <textbutton {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps} ref={ref as never}>
          {props.children}
        </textbutton>
      )}
    </RadioGroupItemContextProvider>
  );
}
