import { React, Slot } from "@lattice-ui/core";
import { useActivationGuard, useFocusNode } from "@lattice-ui/focus";
import { createSelectionResponseRecipe, useResponseMotion } from "@lattice-ui/motion";
import { useAccordionContext, useAccordionItemContext } from "./context";
import type { AccordionTriggerProps } from "./types";

export function AccordionTrigger(props: AccordionTriggerProps) {
  const accordionContext = useAccordionContext();
  const itemContext = useAccordionItemContext();
  const disabled = itemContext.disabled;

  const triggerRef = React.useRef<GuiObject>();
  const motionRef = useResponseMotion<GuiObject>(
    itemContext.open,
    {
      active: { BackgroundColor3: Color3.fromRGB(59, 66, 84) },
      inactive: { BackgroundColor3: Color3.fromRGB(41, 48, 63) },
    },
    createSelectionResponseRecipe(),
  );

  const setTriggerRef = React.useCallback(
    (instance: Instance | undefined) => {
      const nextTrigger = instance?.IsA("GuiObject") ? instance : undefined;
      triggerRef.current = nextTrigger;
      motionRef.current = nextTrigger;
    },
    [motionRef],
  );

  useFocusNode({
    ref: triggerRef,
    disabled,
  });

  const claimActivation = useActivationGuard();

  // A single gamepad/keyboard activation fires both `Activated` and the
  // `Return`/`Space` `InputBegan` branch; the guard collapses them so the item
  // expands once instead of toggling twice back to its previous state.
  const toggle = React.useCallback(() => {
    if (disabled || !claimActivation()) {
      return;
    }

    accordionContext.toggleItem(itemContext.value);
  }, [accordionContext, claimActivation, disabled, itemContext.value]);

  const handleInputBegan = React.useCallback(
    (_rbx: GuiObject, inputObject: InputObject) => {
      const keyCode = inputObject.KeyCode;
      if (keyCode === Enum.KeyCode.Return || keyCode === Enum.KeyCode.Space) {
        toggle();
      }
    },
    [toggle],
  );

  const eventHandlers = React.useMemo(
    () => ({
      Activated: toggle,
      InputBegan: handleInputBegan,
    }),
    [handleInputBegan, toggle],
  );

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[AccordionTrigger] `asChild` requires a child element.");
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
      BackgroundColor3={itemContext.open ? Color3.fromRGB(59, 66, 84) : Color3.fromRGB(41, 48, 63)}
      BorderSizePixel={0}
      Event={eventHandlers}
      Selectable={!disabled}
      Size={UDim2.fromOffset(260, 34)}
      Text={itemContext.open ? "Collapse" : "Expand"}
      TextColor3={disabled ? Color3.fromRGB(143, 150, 165) : Color3.fromRGB(236, 241, 249)}
      TextSize={14}
      TextXAlignment={Enum.TextXAlignment.Left}
      ref={setTriggerRef}
    >
      <uipadding PaddingLeft={new UDim(0, 10)} />
      {props.children}
    </textbutton>
  );
}
