import { React, useControllableState } from "@lattice-ui/core";
import { PopoverContextProvider } from "./context";
import type { PopoverProps } from "./types";

export function Popover(props: PopoverProps) {
  const [open, setOpenState] = useControllableState<boolean>({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  });
  const modal = props.modal ?? false;

  const triggerRef = React.useRef<GuiObject>();
  const anchorRef = React.useRef<GuiObject>();
  const contentRef = React.useRef<GuiObject>();

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
      anchorRef,
      contentRef,
    }),
    [modal, open, setOpen],
  );

  return <PopoverContextProvider value={contextValue}>{props.children}</PopoverContextProvider>;
}
