import { getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import { useTextareaContext } from "./context";
import type { TextareaMessageProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// See TextareaInput: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

export function TextareaMessage(props: TextareaMessageProps) {
  // Renders nothing of its own, but must still be inside a `Textarea.Root`.
  useTextareaContext();

  const passthrough = getPassthroughProps<TextLabel>(props, OWN_PROPS);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[TextareaMessage] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return <Slot {...toSlotProps(passthrough)}>{child}</Slot>;
  }

  return (
    <textlabel {...NEUTRAL_PROPS} {...passthrough}>
      {props.children}
    </textlabel>
  );
}
