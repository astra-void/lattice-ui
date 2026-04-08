import { React, Slot } from "@lattice-ui/core";
import { createSelectionResponseRecipe, useResponseMotion } from "@lattice-ui/motion";
import { useAccordionContext, useAccordionItemContext } from "./context";
import type { AccordionTriggerProps } from "./types";

export function AccordionTrigger(props: AccordionTriggerProps) {
  const accordionContext = useAccordionContext();
  const itemContext = useAccordionItemContext();
  const disabled = itemContext.disabled;

  const motionRef = useResponseMotion<TextButton>(
    itemContext.open,
    {
      active: { BackgroundColor3: Color3.fromRGB(59, 66, 84) },
      inactive: { BackgroundColor3: Color3.fromRGB(41, 48, 63) },
    },
    createSelectionResponseRecipe(0.15),
  );

  const handleActivated = React.useCallback(() => {
    if (disabled) {
      return;
    }

    accordionContext.toggleItem(itemContext.value);
  }, [accordionContext, disabled, itemContext.value]);

  const handleInputBegan = React.useCallback(
    (_rbx: GuiObject, inputObject: InputObject) => {
      if (disabled) {
        return;
      }

      const keyCode = inputObject.KeyCode;
      if (keyCode === Enum.KeyCode.Return || keyCode === Enum.KeyCode.Space) {
        accordionContext.toggleItem(itemContext.value);
      }
    },
    [accordionContext, disabled, itemContext.value],
  );

  const eventHandlers = React.useMemo(
    () => ({
      Activated: handleActivated,
      InputBegan: handleInputBegan,
    }),
    [handleActivated, handleInputBegan],
  );

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[AccordionTrigger] `asChild` requires a child element.");
    }

    return (
      <Slot Active={!disabled} Event={eventHandlers} Selectable={false} ref={motionRef}>
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
      Selectable={false}
      Size={UDim2.fromOffset(260, 34)}
      Text={itemContext.open ? "Collapse" : "Expand"}
      TextColor3={disabled ? Color3.fromRGB(143, 150, 165) : Color3.fromRGB(236, 241, 249)}
      TextSize={14}
      TextXAlignment={Enum.TextXAlignment.Left}
      ref={motionRef}
    >
      <uipadding PaddingLeft={new UDim(0, 10)} />
      {props.children}
    </textbutton>
  );
}
