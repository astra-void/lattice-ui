import { React, Slot } from "@lattice-ui/core";
import { RovingFocusItem } from "@lattice-ui/focus";
import { useTabsContext } from "./context";
import { createTabsTriggerName } from "./internals/ids";
import type { TabsTriggerProps } from "./types";

let nextTriggerId = 0;
let nextTriggerOrder = 0;

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

export function TabsTrigger(props: TabsTriggerProps) {
  const tabsContext = useTabsContext();
  const triggerRef = React.useRef<GuiObject>();
  const selected = tabsContext.value === props.value;
  const disabled = props.disabled === true;

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
      disabled,
      ref: triggerRef,
      order: triggerOrderRef.current,
    });
  }, [disabled, props.value, tabsContext]);

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
    if (disabled || tabsContext.activationMode !== "automatic") {
      return;
    }

    tabsContext.setValue(props.value);
  }, [disabled, props.value, tabsContext]);

  const handleInputBegan = React.useCallback(
    (_rbx: TextButton, inputObject: InputObject) => {
      if (disabled || tabsContext.activationMode !== "manual") {
        return;
      }

      const keyCode = inputObject.KeyCode;
      if (keyCode !== Enum.KeyCode.Return && keyCode !== Enum.KeyCode.Space) {
        return;
      }

      tabsContext.setValue(props.value);
    },
    [disabled, props.value, tabsContext],
  );

  const eventHandlers = React.useMemo(
    () => ({
      Activated: handleActivated,
      SelectionGained: handleSelectionGained,
      InputBegan: handleInputBegan,
    }),
    [handleActivated, handleInputBegan, handleSelectionGained],
  );

  const triggerName = React.useMemo(() => createTabsTriggerName(props.value), [props.value]);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[TabsTrigger] `asChild` requires a child element.");
    }

    return (
      <RovingFocusItem asChild disabled={disabled}>
        <Slot Event={eventHandlers} Name={triggerName} ref={setTriggerRef}>
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
        BackgroundColor3={selected ? Color3.fromRGB(86, 137, 245) : Color3.fromRGB(47, 53, 68)}
        BorderSizePixel={0}
        Event={eventHandlers}
        Selectable={!disabled}
        Size={UDim2.fromOffset(132, 34)}
        Text={props.value}
        TextColor3={disabled ? Color3.fromRGB(136, 144, 159) : Color3.fromRGB(235, 240, 248)}
        TextSize={15}
        ref={setTriggerRef}
      >
        {props.children}
      </textbutton>
    </RovingFocusItem>
  );
}
