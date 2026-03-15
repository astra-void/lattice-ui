import { React, Slot } from "@lattice-ui/core";
import { usePopoverContext } from "./context";
import type { PopoverCloseProps } from "./types";

export function PopoverClose(props: PopoverCloseProps) {
  const popoverContext = usePopoverContext();

  const handleActivated = React.useCallback(() => {
    popoverContext.setOpen(false);
  }, [popoverContext.setOpen]);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[PopoverClose] `asChild` requires a child element.");
    }

    return <Slot Active={true} Event={{ Activated: handleActivated }} Selectable={false}>{child}</Slot>;
  }

  return (
    <textbutton
      Active={true}
      AutoButtonColor={false}
      BackgroundTransparency={1}
      BorderSizePixel={0}
      Event={{ Activated: handleActivated }}
      Selectable={false}
      Size={UDim2.fromOffset(110, 34)}
      Text="Close"
      TextColor3={Color3.fromRGB(240, 244, 250)}
      TextSize={16}
    >
      {props.children}
    </textbutton>
  );
}
