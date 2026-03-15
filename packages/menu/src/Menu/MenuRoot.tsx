import { React, useControllableState } from "@lattice-ui/core";
import { MenuContextProvider } from "./context";
import type { MenuProps } from "./types";

export function Menu(props: MenuProps) {
  const [open, setOpenState] = useControllableState<boolean>({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  });
  const modal = props.modal ?? true;

  const triggerRef = React.useRef<GuiObject>();
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
      contentRef,
    }),
    [modal, open, setOpen],
  );

  return <MenuContextProvider value={contextValue}>{props.children}</MenuContextProvider>;
}
