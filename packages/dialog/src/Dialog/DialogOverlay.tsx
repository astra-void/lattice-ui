import { React, Slot } from "@lattice-ui/core";
import { useOverlayMotion } from "@lattice-ui/motion";
import { useDialogContext } from "./context";
import type { DialogOverlayProps } from "./types";

export function DialogOverlay(props: DialogOverlayProps) {
  const dialogContext = useDialogContext();
  const open = dialogContext.open;

  const { ref: motionRef, isPresent } = useOverlayMotion(open, true);

  const handleActivated = React.useCallback(() => {
    dialogContext.setOpen(false);
  }, [dialogContext.setOpen]);

  if (!isPresent && !props.forceMount) {
    return undefined;
  }

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[DialogOverlay] `asChild` requires a child element.");
    }

    return (
      <Slot Active={open} Event={{ Activated: handleActivated }} ref={motionRef}>
        {child}
      </Slot>
    );
  }

  return (
    <textbutton
      Active={open}
      AutoButtonColor={false}
      BackgroundColor3={Color3.fromRGB(8, 10, 14)}
      BorderSizePixel={0}
      Event={{ Activated: handleActivated }}
      Position={UDim2.fromScale(0, 0)}
      Selectable={false}
      Size={UDim2.fromScale(1, 1)}
      Text=""
      TextTransparency={1}
      ZIndex={5}
      ref={motionRef as React.MutableRefObject<TextButton>}
    />
  );
}
