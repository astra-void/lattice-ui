import { focusOrderedSelectionEntry, getFirstOrderedSelectionEntry } from "@lattice-ui/react-focus";
import { React, useControllableState } from "@lattice-ui/react-runtime";
import { ContextMenuContextProvider } from "./context";
import type { ContextMenuItemRegistration, ContextMenuProps } from "./types";

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
  const itemEntriesRef = React.useRef<Array<ContextMenuItemRegistration>>([]);
  const [registryRevision, setRegistryRevision] = React.useState(0);
  const focusedOnOpenRef = React.useRef(false);

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

  const registerItem = React.useCallback((item: ContextMenuItemRegistration) => {
    itemEntriesRef.current.push(item);
    setRegistryRevision((revision) => revision + 1);

    return () => {
      const index = itemEntriesRef.current.findIndex((entry) => entry.id === item.id);
      if (index >= 0) {
        itemEntriesRef.current.remove(index);
        setRegistryRevision((revision) => revision + 1);
      }
    };
  }, []);

  // Move focus into the menu once per open, as soon as its items have
  // registered. Later registry changes (items shown or filtered while open)
  // must not pull focus back to the first item.
  React.useEffect(() => {
    if (!open) {
      focusedOnOpenRef.current = false;
      return;
    }

    if (focusedOnOpenRef.current) {
      return;
    }

    const firstEntry = getFirstOrderedSelectionEntry(itemEntriesRef.current);
    if (firstEntry) {
      focusedOnOpenRef.current = true;
      focusOrderedSelectionEntry(firstEntry);
    }
  }, [open, registryRevision]);

  const contextValue = React.useMemo(
    () => ({
      open,
      setOpen,
      modal,
      anchorPosition,
      openAtPosition,
      virtualAnchorRef,
      contentRef,
      registerItem,
    }),
    [anchorPosition, modal, open, openAtPosition, registerItem, setOpen],
  );

  return <ContextMenuContextProvider value={contextValue}>{props.children}</ContextMenuContextProvider>;
}
