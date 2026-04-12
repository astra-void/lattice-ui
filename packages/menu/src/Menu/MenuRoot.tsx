import { React, useControllableState } from "@lattice-ui/core";
import {
  focusGuiObject,
  focusOrderedSelectionEntry,
  getCurrentOrderedSelectionEntry,
  getFirstOrderedSelectionEntry,
  getRelativeOrderedSelectionEntry,
} from "@lattice-ui/focus";
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

  const moveSelection = React.useCallback((direction: -1 | 1) => {
    const currentItem = getCurrentOrderedSelectionEntry(itemEntriesRef.current);
    const nextItem = getRelativeOrderedSelectionEntry(itemEntriesRef.current, currentItem?.id, direction);
    focusOrderedSelectionEntry(nextItem);
  }, []);

  const restoreTriggerFocus = React.useCallback(() => {
    focusGuiObject(triggerRef.current);
  }, []);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    focusFirstItem();
  }, [focusFirstItem, open, registryRevision]);

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
      moveSelection,
      restoreTriggerFocus,
    }),
    [focusFirstItem, modal, moveSelection, open, registerItem, restoreTriggerFocus, setOpen],
  );

  return <MenuContextProvider value={contextValue}>{props.children}</MenuContextProvider>;
}
