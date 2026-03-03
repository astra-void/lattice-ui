import { React, useControllableState } from "@lattice-ui/core";
import { DialogContextProvider } from "./context";
import type { DialogProps } from "./types";

export function Dialog(props: DialogProps) {
  const [open, setOpenState] = useControllableState<boolean>({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  });
  const modal = props.modal ?? true;
  const triggerRef = React.useRef<GuiObject>();

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      setOpenState(nextOpen);
    },
    [setOpenState],
  );

  const contextValue = React.useMemo(
    () => ({
      open,
      setOpen,
      modal,
      triggerRef,
    }),
    [modal, open, setOpen],
  );

  return <DialogContextProvider value={contextValue}>{props.children}</DialogContextProvider>;
}
