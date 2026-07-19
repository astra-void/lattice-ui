import { React, Slot } from "@lattice-ui/react-runtime";
import type { ContextMenuGroupProps } from "./types";

export function ContextMenuGroup(props: ContextMenuGroupProps) {
  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ContextMenuGroup] `asChild` requires a child element.");
    }

    return <Slot>{child}</Slot>;
  }

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(220, 0)}>
      <uilistlayout
        FillDirection={Enum.FillDirection.Vertical}
        Padding={new UDim(0, 4)}
        SortOrder={Enum.SortOrder.LayoutOrder}
      />
      {props.children}
    </frame>
  );
}
