import { React, Slot } from "@lattice-ui/core";
import { useDialogContext } from "./context";
import type { DialogCloseProps } from "./types";

export function DialogClose(props: DialogCloseProps) {
  const dialogContext = useDialogContext();

  const handleActivated = React.useCallback(() => {
    dialogContext.setOpen(false);
  }, [dialogContext.setOpen]);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[DialogClose] `asChild` requires a child element.");
    }

    return (
      <Slot Active={true} Event={{ Activated: handleActivated }} Selectable={false}>
        {child}
      </Slot>
    );
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
