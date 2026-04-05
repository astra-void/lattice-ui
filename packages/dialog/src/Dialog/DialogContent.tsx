import { React, Slot } from "@lattice-ui/core";
import { useSurfaceMotion } from "@lattice-ui/motion";
import { FocusScope } from "@lattice-ui/focus";
import { DismissableLayer } from "@lattice-ui/layer";
import { useDialogContext } from "./context";
import type { DialogContentProps } from "./types";

export function DialogContent(props: DialogContentProps) {
  const dialogContext = useDialogContext();
  const open = dialogContext.open;
  const trapFocus = props.trapFocus ?? true;
  const restoreFocus = props.restoreFocus ?? true;

  const { ref: motionRef, isPresent } = useSurfaceMotion(open, true);

  const handleDismiss = React.useCallback(() => {
    dialogContext.setOpen(false);
  }, [dialogContext.setOpen]);

  if (!isPresent && !props.forceMount) {
    return undefined;
  }

  return (
    <DismissableLayer
      enabled={open}
      modal={dialogContext.modal}
      onDismiss={handleDismiss}
      onInteractOutside={props.onInteractOutside}
      onPointerDownOutside={props.onPointerDownOutside}
    >
      <FocusScope active={open} restoreFocus={restoreFocus} trapped={trapFocus}>
        <frame BackgroundTransparency={1} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)} ZIndex={10}>
          <Slot ref={motionRef as React.MutableRefObject<Instance>}>{props.children}</Slot>
        </frame>
      </FocusScope>
    </DismissableLayer>
  );
}
