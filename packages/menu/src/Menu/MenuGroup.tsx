import { React, Slot } from "@lattice-ui/core";
import type { MenuGroupProps } from "./types";

export function MenuGroup(props: MenuGroupProps) {
  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[MenuGroup] `asChild` requires a child element.");
    }

    return <Slot>{child}</Slot>;
  }

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(220, 0)}>
      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 4)} SortOrder={Enum.SortOrder.LayoutOrder} />
      {props.children}
    </frame>
  );
}
