import { React, useControllableState } from "@lattice-ui/react-runtime";
import { ContextMenuContextProvider } from "./context";
import type { ContextMenuProps } from "./types";

const ZERO_VECTOR2 = new Vector2(0, 0);

export function ContextMenu(props: ContextMenuProps) {
  const [open, setOpenState] = useControllableState<boolean>({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  });
  const modal = props.modal ?? true;

  const contentRef = React.useRef<GuiObject>();
  const virtualAnchorRef = React.useRef<GuiObject>();
  const [anchorPosition, setAnchorPosition] = React.useState<Vector2>(ZERO_VECTOR2);

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      setOpenState(nextOpen);
    },
    [setOpenState],
  );

  const openAtPosition = React.useCallback(
    (position: Vector2) => {
      setAnchorPosition(position);
      setOpenState(true);
    },
    [setOpenState],
  );

  const contextValue = React.useMemo(
    () => ({
      open,
      setOpen,
      modal,
      anchorPosition,
      openAtPosition,
      virtualAnchorRef,
      contentRef,
    }),
    [anchorPosition, modal, open, openAtPosition, setOpen],
  );

  return <ContextMenuContextProvider value={contextValue}>{props.children}</ContextMenuContextProvider>;
}
