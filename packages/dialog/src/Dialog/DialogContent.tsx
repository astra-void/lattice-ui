import { React } from "@lattice-ui/core";
import { FocusScope } from "@lattice-ui/focus";
import { DismissableLayer, Presence } from "@lattice-ui/layer";
import { useDialogContext } from "./context";
import type { DialogContentProps } from "./types";

type DialogContentImplProps = {
  enabled: boolean;
  modal: boolean;
  trapFocus: boolean;
  restoreFocus: boolean;
  onDismiss: () => void;
} & Pick<DialogContentProps, "children" | "onEscapeKeyDown" | "onInteractOutside" | "onPointerDownOutside">;

function DialogContentImpl(props: DialogContentImplProps) {
  return (
    <DismissableLayer
      enabled={props.enabled}
      modal={props.modal}
      onDismiss={props.onDismiss}
      onEscapeKeyDown={props.onEscapeKeyDown}
      onInteractOutside={props.onInteractOutside}
      onPointerDownOutside={props.onPointerDownOutside}
    >
      <FocusScope restoreFocus={props.restoreFocus} trapped={props.trapFocus}>
        {props.children}
      </FocusScope>
    </DismissableLayer>
  );
}

export function DialogContent(props: DialogContentProps) {
  const dialogContext = useDialogContext();
  const open = dialogContext.open;
  const forceMount = props.forceMount === true;
  const trapFocus = props.trapFocus ?? true;
  const restoreFocus = props.restoreFocus ?? true;

  const handleDismiss = React.useCallback(() => {
    dialogContext.setOpen(false);
  }, [dialogContext.setOpen]);

  if (!open && !forceMount) {
    return undefined;
  }

  if (forceMount) {
    return (
      <DialogContentImpl
        enabled={open}
        modal={dialogContext.modal}
        onDismiss={handleDismiss}
        onEscapeKeyDown={props.onEscapeKeyDown}
        onInteractOutside={props.onInteractOutside}
        onPointerDownOutside={props.onPointerDownOutside}
        restoreFocus={restoreFocus}
        trapFocus={trapFocus}
      >
        {props.children}
      </DialogContentImpl>
    );
  }

  return (
    <Presence
      exitFallbackMs={0}
      present={open}
      render={(state) => (
        <DialogContentImpl
          enabled={state.isPresent}
          modal={dialogContext.modal}
          onDismiss={handleDismiss}
          onEscapeKeyDown={props.onEscapeKeyDown}
          onInteractOutside={props.onInteractOutside}
          onPointerDownOutside={props.onPointerDownOutside}
          restoreFocus={restoreFocus}
          trapFocus={trapFocus}
        >
          {props.children}
        </DialogContentImpl>
      )}
    />
  );
}
