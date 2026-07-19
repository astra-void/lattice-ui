import { useActivationGuard, useFocusNode } from "@lattice-ui/react-focus";
import { composeEvents, composeRefs, getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import { useToggleGroupContext } from "./context";
import type { ToggleGroupItemProps } from "./types";

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

export function ToggleGroupItem(props: ToggleGroupItemProps) {
  const toggleGroupContext = useToggleGroupContext();
  const disabled = toggleGroupContext.disabled || props.disabled === true;
  const itemRef = React.useRef<GuiObject>();

  const setItemRef = React.useCallback((instance: Instance | undefined) => {
    itemRef.current = instance?.IsA("GuiObject") ? instance : undefined;
  }, []);

  useFocusNode({
    ref: itemRef,
    disabled,
  });

  const claimActivation = useActivationGuard();

  // `Activated` and the `Return`/`Space` `InputBegan` branch share this guarded
  // path so one gamepad/keyboard activation — which fires both — toggles the
  // item once rather than flipping it and immediately flipping it back.
  const handleToggle = React.useCallback(() => {
    if (disabled || !claimActivation()) {
      return;
    }

    toggleGroupContext.toggleValue(props.value);
  }, [claimActivation, disabled, props.value, toggleGroupContext]);

  const handleInputBegan = React.useCallback(
    (_rbx: TextButton, inputObject: InputObject) => {
      const keyCode = inputObject.KeyCode;
      if (keyCode !== Enum.KeyCode.Return && keyCode !== Enum.KeyCode.Space) {
        return;
      }

      handleToggle();
    },
    [handleToggle],
  );

  const passthrough = getPassthroughProps<TextButton>(props, OWN_PROPS);
  const behaviorProps = {
    Active: !disabled,
    Event: composeEvents(passthrough.Event, {
      Activated: handleToggle,
      InputBegan: handleInputBegan,
    }),
    Selectable: !disabled,
  };
  const ref = composeRefs<GuiObject>(passthrough.ref as never, setItemRef);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ToggleGroupItem] `asChild` requires a child element.");
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
