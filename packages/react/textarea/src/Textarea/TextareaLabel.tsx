import { composeEvents, getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import { useTextareaContext } from "./context";
import type { TextareaLabelProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// See TextareaInput: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  AutoButtonColor: false,
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

export function TextareaLabel(props: TextareaLabelProps) {
  const textareaContext = useTextareaContext();
  const disabled = textareaContext.disabled;

  const handleActivated = React.useCallback(() => {
    if (disabled) {
      return;
    }

    textareaContext.inputRef.current?.CaptureFocus();
  }, [disabled, textareaContext.inputRef]);

  const passthrough = getPassthroughProps<TextButton>(props, OWN_PROPS);
  const behaviorProps = {
    Active: !disabled,
    Selectable: !disabled,
    Event: composeEvents(passthrough.Event, { Activated: handleActivated }),
  };

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[TextareaLabel] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return (
      <Slot {...toSlotProps(passthrough)} {...behaviorProps}>
        {child}
      </Slot>
    );
  }

  return <textbutton {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps} />;
}
