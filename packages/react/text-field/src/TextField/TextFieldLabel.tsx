import { composeEvents, getPassthroughProps, React, Slot } from "@lattice-ui/react-runtime";
import { useTextFieldContext } from "./context";
import type { TextFieldLabelProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// See TextFieldInput: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  AutoButtonColor: false,
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

export function TextFieldLabel(props: TextFieldLabelProps) {
  const textFieldContext = useTextFieldContext();
  const disabled = textFieldContext.disabled;

  const handleActivated = React.useCallback(() => {
    if (disabled) {
      return;
    }

    textFieldContext.inputRef.current?.CaptureFocus();
  }, [disabled, textFieldContext.inputRef]);

  const passthrough = getPassthroughProps(props, OWN_PROPS);
  const behaviorProps = {
    Active: !disabled,
    Selectable: !disabled,
    Event: composeEvents(passthrough.Event, { Activated: handleActivated }),
  };

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[TextFieldLabel] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return (
      <Slot {...passthrough} {...behaviorProps}>
        {child}
      </Slot>
    );
  }

  return <textbutton {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps} />;
}
