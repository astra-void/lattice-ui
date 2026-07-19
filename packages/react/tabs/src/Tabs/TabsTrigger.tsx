import { useFocusNode } from "@lattice-ui/react-focus";
import { composeEvents, composeRefs, getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import { useTabsContext } from "./context";
import { createTabsTriggerName } from "./internals/ids";
import type { TabsTriggerProps } from "./types";

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

let nextTriggerId = 0;
let nextTriggerOrder = 0;

function toGuiObject(instance: Instance | undefined) {
  if (!instance?.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

export function TabsTrigger(props: TabsTriggerProps) {
  const tabsContext = useTabsContext();
  const triggerRef = React.useRef<GuiObject>();
  const disabled = props.disabled === true;
  const disabledRef = React.useRef(disabled);
  disabledRef.current = disabled;

  const triggerIdRef = React.useRef(0);
  if (triggerIdRef.current === 0) {
    nextTriggerId += 1;
    triggerIdRef.current = nextTriggerId;
  }

  const triggerOrderRef = React.useRef(0);
  if (triggerOrderRef.current === 0) {
    nextTriggerOrder += 1;
    triggerOrderRef.current = nextTriggerOrder;
  }

  React.useEffect(() => {
    return tabsContext.registerTrigger({
      id: triggerIdRef.current,
      value: props.value,
      ref: triggerRef,
      order: triggerOrderRef.current,
      getDisabled: () => disabledRef.current,
    });
  }, [disabled, props.value, tabsContext]);

  useFocusNode({
    ref: triggerRef,
    getDisabled: () => disabledRef.current,
  });

  const setTriggerRef = React.useCallback((instance: Instance | undefined) => {
    triggerRef.current = toGuiObject(instance);
  }, []);

  const handleActivated = React.useCallback(() => {
    if (disabled) {
      return;
    }

    tabsContext.setValue(props.value);
  }, [disabled, props.value, tabsContext]);

  const handleSelectionGained = React.useCallback(() => {
    if (disabled) {
      return;
    }

    tabsContext.setValue(props.value);
  }, [disabled, props.value, tabsContext]);

  const handleInputBegan = React.useCallback(
    (_rbx: TextButton, inputObject: InputObject) => {
      if (disabled) {
        return;
      }

      const keyCode = inputObject.KeyCode;
      const direction =
        tabsContext.orientation === "horizontal"
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
        tabsContext.moveSelection(props.value, direction);
        return;
      }

      if (keyCode !== Enum.KeyCode.Return && keyCode !== Enum.KeyCode.Space) {
        return;
      }

      tabsContext.setValue(props.value);
    },
    [disabled, props.value, tabsContext],
  );

  const triggerName = React.useMemo(() => createTabsTriggerName(props.value), [props.value]);

  const passthrough = getPassthroughProps<TextButton>(props, OWN_PROPS);
  const behaviorProps = {
    Active: !disabled,
    Event: composeEvents(passthrough.Event, {
      Activated: handleActivated,
      InputBegan: handleInputBegan,
      SelectionGained: handleSelectionGained,
    }),
    // The name pairs the trigger with its panel, so it is wiring rather than appearance.
    Name: triggerName,
    Selectable: !disabled,
  };
  const ref = composeRefs<GuiObject>(passthrough.ref as never, setTriggerRef);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[TabsTrigger] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return (
      <Slot {...toSlotProps(passthrough)} {...behaviorProps} ref={ref as never}>
        {child}
      </Slot>
    );
  }

  return (
    <textbutton {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps} ref={ref as never}>
      {props.children}
    </textbutton>
  );
}
