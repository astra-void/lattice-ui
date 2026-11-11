import { getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import { useTextFieldContext } from "./context";
import type { TextFieldMessageProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// See TextFieldInput: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

export const TextFieldMessage = React.forwardRef<TextLabel, TextFieldMessageProps>((props, forwardedRef) => {
  // Renders nothing of its own, but must still be inside a `TextField.Root`.
  useTextFieldContext();

  const passthrough = getPassthroughProps<TextLabel>(props, OWN_PROPS, forwardedRef);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[TextFieldMessage] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return <Slot {...toSlotProps(passthrough)}>{child}</Slot>;
  }

  return (
    <textlabel {...NEUTRAL_PROPS} {...passthrough}>
      {props.children}
    </textlabel>
  );
});
TextFieldMessage.displayName = "TextFieldMessage";
