import { React, Slot } from "@lattice-ui/core";
import { useActivationGuard, useFocusNode } from "@lattice-ui/focus";
import { useSelectContext } from "./context";
import type { SelectTriggerProps } from "./types";

function toGuiObject(instance: Instance | undefined) {
  if (!instance?.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

export function SelectTrigger(props: SelectTriggerProps) {
  const selectContext = useSelectContext();
  const disabled = selectContext.disabled || props.disabled === true;
  const triggerRef = selectContext.triggerRef;

  const setTriggerRef = React.useCallback(
    (instance: Instance | undefined) => {
      triggerRef.current = toGuiObject(instance);
    },
    [triggerRef],
  );

  useFocusNode({
    ref: triggerRef,
    disabled,
  });

  const claimActivation = useActivationGuard();

  // Both `Activated` and the `Return`/`Space` `InputBegan` branch route through
  // this guarded toggle so a single gamepad/keyboard activation — which fires
  // both events — flips `open` once instead of cancelling itself out.
  const toggleOpen = React.useCallback(() => {
    if (disabled || !claimActivation()) {
      return;
    }

    selectContext.setOpen(!selectContext.open);
  }, [claimActivation, disabled, selectContext]);

  const handleInputBegan = React.useCallback(
    (_rbx: GuiObject, inputObject: InputObject) => {
      const keyCode = inputObject.KeyCode;
      if (keyCode === Enum.KeyCode.Return || keyCode === Enum.KeyCode.Space) {
        toggleOpen();
      }
    },
    [toggleOpen],
  );

  const eventHandlers = React.useMemo(
    () => ({
      Activated: toggleOpen,
      InputBegan: handleInputBegan,
    }),
    [handleInputBegan, toggleOpen],
  );

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[SelectTrigger] `asChild` requires a child element.");
    }

    return (
      <Slot Active={!disabled} Event={eventHandlers} Selectable={!disabled} ref={setTriggerRef}>
        {child}
      </Slot>
    );
  }

  return (
    <textbutton
      Active={!disabled}
      AutoButtonColor={false}
      BackgroundColor3={Color3.fromRGB(41, 48, 63)}
      BorderSizePixel={0}
      Event={eventHandlers}
      Selectable={!disabled}
      Size={UDim2.fromOffset(220, 36)}
      Text="Select"
      TextColor3={disabled ? Color3.fromRGB(140, 148, 164) : Color3.fromRGB(235, 241, 248)}
      TextSize={15}
      ref={setTriggerRef}
    >
      {props.children}
    </textbutton>
  );
}
