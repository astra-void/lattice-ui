import { composeEvents, composeRefs, getPassthroughProps, React, Slot } from "@lattice-ui/react-runtime";
import { useComboboxContext } from "./context";
import type { ComboboxTriggerProps } from "./types";

const OWN_PROPS = ["asChild", "disabled", "children"] as const;

// Roblox instance defaults are themselves a look: a bare `textbutton` renders an opaque grey box
// labelled "Button". Neutralize only that, and leave every real appearance decision (colors, size,
// fonts, text) to the consumer. Passthrough props are spread after these, so they stay overridable.
const NEUTRAL_PROPS = {
  AutoButtonColor: false,
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

function toGuiObject(instance: Instance | undefined) {
  if (!instance?.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

export function ComboboxTrigger(props: ComboboxTriggerProps) {
  const comboboxContext = useComboboxContext();
  const disabled = comboboxContext.disabled || props.disabled === true;

  const setTriggerRef = React.useCallback(
    (instance: Instance | undefined) => {
      const previousTrigger = comboboxContext.triggerRef.current;
      const nextTrigger = toGuiObject(instance);

      comboboxContext.triggerRef.current = nextTrigger;

      if (comboboxContext.inputRef.current) {
        return;
      }

      if (nextTrigger) {
        comboboxContext.anchorRef.current = nextTrigger;
        return;
      }

      if (comboboxContext.anchorRef.current === previousTrigger) {
        comboboxContext.anchorRef.current = undefined;
      }
    },
    [comboboxContext.anchorRef, comboboxContext.inputRef, comboboxContext.triggerRef],
  );

  const handleActivated = React.useCallback(() => {
    if (disabled) {
      return;
    }

    comboboxContext.setOpen(!comboboxContext.open);
  }, [comboboxContext, disabled]);

  const handleInputBegan = React.useCallback(
    (_rbx: GuiObject, inputObject: InputObject) => {
      if (disabled) {
        return;
      }

      const keyCode = inputObject.KeyCode;
      if (keyCode === Enum.KeyCode.Return || keyCode === Enum.KeyCode.Space) {
        comboboxContext.setOpen(!comboboxContext.open);
      }
    },
    [comboboxContext, disabled],
  );

  const passthrough = getPassthroughProps(props, OWN_PROPS);
  const behaviorProps = {
    Active: !disabled,
    Event: composeEvents(passthrough.Event, {
      Activated: handleActivated,
      InputBegan: handleInputBegan,
    }),
    // The input owns gamepad/keyboard focus for the combobox, so the trigger stays out of the
    // selection order.
    Selectable: false,
    ref: composeRefs<Instance>(passthrough.ref as never, setTriggerRef),
  };

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ComboboxTrigger] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return (
      <Slot {...passthrough} {...behaviorProps}>
        {child}
      </Slot>
    );
  }

  return (
    <textbutton {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps}>
      {props.children}
    </textbutton>
  );
}
