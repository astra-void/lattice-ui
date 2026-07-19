import { useActivationGuard, useFocusNode } from "@lattice-ui/react-focus";
import { composeEvents, composeRefs, getPassthroughProps, React, Slot } from "@lattice-ui/react-runtime";
import { useSelectContext } from "./context";
import type { SelectTriggerProps } from "./types";

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

  const passthrough = getPassthroughProps(props, OWN_PROPS);
  const behaviorProps = {
    Active: !disabled,
    Event: composeEvents(passthrough.Event, {
      Activated: toggleOpen,
      InputBegan: handleInputBegan,
    }),
    Selectable: !disabled,
    ref: composeRefs<Instance>(passthrough.ref as never, setTriggerRef),
  };

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[SelectTrigger] `asChild` requires a child element.");
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
