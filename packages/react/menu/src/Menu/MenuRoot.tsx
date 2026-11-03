import { focusGuiObject, focusOrderedSelectionEntry, getFirstOrderedSelectionEntry } from "@lattice-ui/react-focus";
import { React, useControllableState } from "@lattice-ui/react-runtime";
import { MenuContextProvider } from "./context";
import type { MenuItemRegistration, MenuProps } from "./types";

export function Menu(props: MenuProps) {
  const [open, setOpenState] = useControllableState<boolean>({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  });
  const modal = props.modal ?? true;

  const triggerRef = React.useRef<GuiObject>();
  const contentRef = React.useRef<GuiObject>();
  const itemEntriesRef = React.useRef<Array<MenuItemRegistration>>([]);
  const [registryRevision, setRegistryRevision] = React.useState(0);

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      setOpenState(nextOpen);
    },
    [setOpenState],
  );

  const registerItem = React.useCallback((item: MenuItemRegistration) => {
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

  const focusFirstItem = React.useCallback(() => {
    focusOrderedSelectionEntry(getFirstOrderedSelectionEntry(itemEntriesRef.current));
  }, []);

  const restoreTriggerFocus = React.useCallback(() => {
    focusGuiObject(triggerRef.current);
  }, []);

  // Move focus into the menu once per open, as soon as its items have
  // registered. Later registry changes (items shown or filtered while open)
  // must not pull focus back to the first item.
  const focusedOnOpenRef = React.useRef(false);
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

  const wasOpenRef = React.useRef(open);
  React.useEffect(() => {
    if (wasOpenRef.current && !open) {
      restoreTriggerFocus();
      task.defer(restoreTriggerFocus);
    }

    wasOpenRef.current = open;
  }, [open, restoreTriggerFocus]);

  const contextValue = React.useMemo(
    () => ({
      open,
      setOpen,
      modal,
      triggerRef,
      contentRef,
      registerItem,
      focusFirstItem,
      restoreTriggerFocus,
    }),
    [focusFirstItem, modal, open, registerItem, restoreTriggerFocus, setOpen],
  );

  return <MenuContextProvider value={contextValue}>{props.children}</MenuContextProvider>;
}
