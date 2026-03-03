import { React, useControllableState } from "@lattice-ui/core";
import { TooltipContextProvider, useTooltipProviderContext } from "./context";
import type { TooltipProps } from "./types";

export function Tooltip(props: TooltipProps) {
  const providerContext = useTooltipProviderContext();
  const [open, setOpenState] = useControllableState<boolean>({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  });

  const triggerRef = React.useRef<GuiObject>();
  const contentRef = React.useRef<GuiObject>();
  const openDelayTaskRef = React.useRef<thread>();

  const cancelPendingOpen = React.useCallback(() => {
    const openDelayTask = openDelayTaskRef.current;
    if (!openDelayTask) {
      return;
    }

    task.cancel(openDelayTask);
    openDelayTaskRef.current = undefined;
  }, []);

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      setOpenState(nextOpen);
      if (nextOpen) {
        providerContext.markOpen();
      }
    },
    [providerContext, setOpenState],
  );

  const openWithDelay = React.useCallback(() => {
    cancelPendingOpen();

    const resolvedDelay = providerContext.resolveOpenDelay(props.delayDuration);
    if (resolvedDelay <= 0) {
      setOpen(true);
      return;
    }

    openDelayTaskRef.current = task.delay(resolvedDelay / 1000, () => {
      openDelayTaskRef.current = undefined;
      setOpen(true);
    });
  }, [cancelPendingOpen, props.delayDuration, providerContext, setOpen]);

  const close = React.useCallback(() => {
    cancelPendingOpen();
    setOpen(false);
  }, [cancelPendingOpen, setOpen]);

  React.useEffect(() => {
    return () => {
      cancelPendingOpen();
    };
  }, [cancelPendingOpen]);

  const contextValue = React.useMemo(
    () => ({
      open,
      setOpen,
      openWithDelay,
      close,
      triggerRef,
      contentRef,
    }),
    [close, open, openWithDelay, setOpen],
  );

  return <TooltipContextProvider value={contextValue}>{props.children}</TooltipContextProvider>;
}
