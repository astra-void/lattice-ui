import { React, Slot } from "@lattice-ui/core";
import { usePopoverContext } from "./context";
import type { PopoverAnchorProps } from "./types";

function toGuiObject(instance: Instance | undefined) {
  if (!instance?.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

export function PopoverAnchor(props: PopoverAnchorProps) {
  const popoverContext = usePopoverContext();

  const setAnchorRef = React.useCallback(
    (instance: Instance | undefined) => {
      popoverContext.anchorRef.current = toGuiObject(instance);
    },
    [popoverContext.anchorRef],
  );

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[PopoverAnchor] `asChild` requires a child element.");
    }

    return <Slot ref={setAnchorRef}>{child}</Slot>;
  }

  return <frame BackgroundTransparency={1} BorderSizePixel={0} Size={UDim2.fromOffset(0, 0)} ref={setAnchorRef} />;
}
