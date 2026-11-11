import { composeEvents, composeRefs, getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import { ComboboxItemContextProvider, useComboboxContext } from "./context";
import type { ComboboxItemProps } from "./types";

const OWN_PROPS = ["value", "textValue", "disabled", "asChild", "children"] as const;

// See ComboboxTrigger: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  AutoButtonColor: false,
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

let nextItemId = 0;
let nextItemOrder = 0;

export const ComboboxItem = React.forwardRef<TextButton, ComboboxItemProps>((props, forwardedRef) => {
  const comboboxContext = useComboboxContext();
  const textValue = props.textValue ?? props.value;
  const itemQueryMatch = comboboxContext.filterFn(textValue, comboboxContext.queryValue);
  const disabled = comboboxContext.disabled || props.disabled === true;
  const interactionDisabled = disabled || !itemQueryMatch;

  const disabledRef = React.useRef(disabled);
  const textValueRef = React.useRef(textValue);
  const instanceRef = React.useRef<GuiObject>();

  React.useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  React.useEffect(() => {
    textValueRef.current = textValue;
  }, [textValue]);

  const setItemRef = React.useCallback((instance: Instance | undefined) => {
    instanceRef.current = instance?.IsA("GuiObject") ? instance : undefined;
  }, []);

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
      getInstance: () => instanceRef.current,
    });
  }, [registerItem, props.value, textValue, disabled]);

  const handleSelect = React.useCallback(() => {
    if (interactionDisabled) {
      return;
    }

    comboboxContext.setValue(props.value);
    comboboxContext.setOpen(false);
  }, [comboboxContext, interactionDisabled, props.value]);

  // The highlight lives on the root (active-descendant model): the input keeps
  // focus and moves it with the arrow keys, and pointer hover moves it too, so
  // keyboard and mouse always agree on which item Enter would commit.
  const setHighlightedValue = comboboxContext.setHighlightedValue;
  const handlePointerEnter = React.useCallback(() => {
    if (!interactionDisabled) {
      setHighlightedValue(props.value);
    }
  }, [interactionDisabled, props.value, setHighlightedValue]);
  const handlePointerLeave = React.useCallback(() => {
    if (comboboxContext.highlightedValue === props.value) {
      setHighlightedValue(undefined);
    }
  }, [comboboxContext.highlightedValue, props.value, setHighlightedValue]);

  const ownEvents = React.useMemo(
    () => ({
      Activated: handleSelect,
      MouseEnter: handlePointerEnter,
      MouseLeave: handlePointerLeave,
    }),
    [handleSelect, handlePointerEnter, handlePointerLeave],
  );

  // Highlight is tracked, never painted: consumers read it here and style however they like. An
  // item filtered out of the query is hidden, so it never reads as highlighted.
  const itemContextValue = React.useMemo(
    () => ({
      highlighted: comboboxContext.highlightedValue === props.value && !interactionDisabled,
      disabled,
    }),
    [comboboxContext.highlightedValue, disabled, interactionDisabled, props.value],
  );

  const passthrough = getPassthroughProps<TextButton>(props, OWN_PROPS, forwardedRef);
  const behaviorProps = {
    Active: !interactionDisabled,
    Event: composeEvents(passthrough.Event, ownEvents),
    // The input keeps focus while the list is open (the highlight moves instead), so items are
    // never selection targets.
    Selectable: false,
    // Filtering is what this part does: items that no longer match the query are hidden.
    Visible: itemQueryMatch,
    ref: composeRefs<Instance>(passthrough.ref as never, setItemRef),
  };

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ComboboxItem] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return (
      <ComboboxItemContextProvider value={itemContextValue}>
        <Slot {...toSlotProps(passthrough)} {...behaviorProps}>
          {child}
        </Slot>
      </ComboboxItemContextProvider>
    );
  }

  return (
    <ComboboxItemContextProvider value={itemContextValue}>
      <textbutton {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps}>
        {props.children}
      </textbutton>
    </ComboboxItemContextProvider>
  );
});
ComboboxItem.displayName = "ComboboxItem";
