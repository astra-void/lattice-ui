import { getPassthroughProps, React, Slot } from "@lattice-ui/react-runtime";
import type { MenuGroupProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// See MenuTrigger: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

export function MenuGroup(props: MenuGroupProps) {
  const passthrough = getPassthroughProps(props, OWN_PROPS);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[MenuGroup] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return <Slot {...passthrough}>{child}</Slot>;
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
