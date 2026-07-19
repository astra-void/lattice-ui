import { getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import type { ContextMenuGroupProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// See ContextMenuTrigger: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

export function ContextMenuGroup(props: ContextMenuGroupProps) {
  const passthrough = getPassthroughProps<Frame>(props, OWN_PROPS);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ContextMenuGroup] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return <Slot {...toSlotProps(passthrough)}>{child}</Slot>;
  }

  return (
    // A group hugs its items so the menu can size to its content; the vertical stack is the
    // Roblox equivalent of DOM block flow, not a design decision. Spacing is left to the consumer.
    <frame {...NEUTRAL_PROPS} {...passthrough} AutomaticSize={Enum.AutomaticSize.XY}>
      <uilistlayout FillDirection={Enum.FillDirection.Vertical} SortOrder={Enum.SortOrder.LayoutOrder} />
      {props.children}
    </frame>
  );
}
