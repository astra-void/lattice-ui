import { useActivationGuard, useFocusNode } from "@lattice-ui/react-focus";
import { composeEvents, composeRefs, getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import { useAccordionContext, useAccordionItemContext } from "./context";
import type { AccordionTriggerProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// Roblox instance defaults are themselves a look: a bare `textbutton` renders an opaque grey box
// labelled "Button". Neutralize only that, and leave every real appearance decision (colors, size,
// fonts, text) to the consumer. Passthrough props are spread after these, so they stay overridable.
const NEUTRAL_PROPS = {
  AutoButtonColor: false,
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

export function AccordionTrigger(props: AccordionTriggerProps) {
  const accordionContext = useAccordionContext();
  const itemContext = useAccordionItemContext();
  const disabled = itemContext.disabled;

  const triggerRef = React.useRef<GuiObject>();

  const setTriggerRef = React.useCallback((instance: Instance | undefined) => {
    triggerRef.current = instance?.IsA("GuiObject") ? instance : undefined;
  }, []);

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

  const passthrough = getPassthroughProps<TextButton>(props, OWN_PROPS);
  const behaviorProps = {
    Active: !disabled,
    Event: composeEvents(passthrough.Event, {
      Activated: toggle,
      InputBegan: handleInputBegan,
    }),
    Selectable: !disabled,
  };
  const ref = composeRefs<GuiObject>(passthrough.ref as never, setTriggerRef);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[AccordionTrigger] `asChild` requires a child element.");
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
