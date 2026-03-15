import {
  findOrderedSelectionEntry,
  focusGuiObject,
  focusOrderedSelectionEntry,
  getCurrentOrderedSelectionEntry,
  getFirstOrderedSelectionEntry,
  getOrderedSelectionEntries,
  getRelativeOrderedSelectionEntry,
  React,
  useControllableState,
} from "@lattice-ui/core";
import { SelectContextProvider } from "./context";
import type { SelectItemRegistration, SelectProps } from "./types";

export function SelectRoot(props: SelectProps) {
  const [open, setOpenState] = useControllableState<boolean>({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  });

  const [value, setValueState] = useControllableState<string | undefined>({
    value: props.value,
    defaultValue: props.defaultValue,
    onChange: (nextValue) => {
      if (nextValue !== undefined) {
        props.onValueChange?.(nextValue);
      }
    },
  });

  const disabled = props.disabled === true;
  const required = props.required === true;

  const triggerRef = React.useRef<GuiObject>();
  const contentRef = React.useRef<GuiObject>();

  const itemEntriesRef = React.useRef<Array<SelectItemRegistration>>([]);
  const [registryRevision, setRegistryRevision] = React.useState(0);

  const registerItem = React.useCallback((item: SelectItemRegistration) => {
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

  const resolveOrderedItems = React.useCallback(() => {
    return getOrderedSelectionEntries(itemEntriesRef.current);
  }, [registryRevision]);

  const getItemText = React.useCallback(
    (candidateValue: string) => {
      const selected = resolveOrderedItems().find((item) => item.value === candidateValue);
      return selected?.getTextValue();
    },
    [resolveOrderedItems],
  );

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (disabled && nextOpen) {
        return;
      }

      setOpenState(nextOpen);
    },
    [disabled, setOpenState],
  );

  const setValue = React.useCallback(
    (nextValue: string) => {
      if (disabled) {
        return;
      }

      const selected = resolveOrderedItems().find((item) => item.value === nextValue);
      if (selected && selected.getDisabled()) {
        return;
      }

      setValueState(nextValue);
    },
    [disabled, resolveOrderedItems, setValueState],
  );

  const focusSelectedItem = React.useCallback(() => {
    const target =
      (value !== undefined
        ? findOrderedSelectionEntry(itemEntriesRef.current, (item) => item.value === value)
        : undefined) ?? getFirstOrderedSelectionEntry(itemEntriesRef.current);

    focusOrderedSelectionEntry(target);
  }, [value]);

  const moveSelection = React.useCallback((direction: -1 | 1) => {
    const currentItem = getCurrentOrderedSelectionEntry(itemEntriesRef.current);
    const nextItem = getRelativeOrderedSelectionEntry(itemEntriesRef.current, currentItem?.id, direction);
    focusOrderedSelectionEntry(nextItem);
  }, []);

  const restoreTriggerFocus = React.useCallback(() => {
    focusGuiObject(triggerRef.current);
  }, []);

  React.useEffect(() => {
    if (value === undefined) {
      return;
    }

    const orderedItems = resolveOrderedItems();
    const selected = orderedItems.find((item) => item.value === value);
    if (selected && !selected.getDisabled()) {
      return;
    }

    const fallback = orderedItems.find((item) => !item.getDisabled());
    setValueState(fallback?.value);
  }, [registryRevision, resolveOrderedItems, setValueState, value]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    focusSelectedItem();
  }, [focusSelectedItem, open, registryRevision]);

  const previousOpenRef = React.useRef(open);
  React.useEffect(() => {
    const wasOpen = previousOpenRef.current;
    previousOpenRef.current = open;

    if (!open && wasOpen) {
      restoreTriggerFocus();
    }
  }, [open, restoreTriggerFocus]);

  const contextValue = React.useMemo(
    () => ({
      open,
      setOpen,
      value,
      setValue,
      disabled,
      required,
      triggerRef,
      contentRef,
      registerItem,
      getItemText,
      focusSelectedItem,
      moveSelection,
      restoreTriggerFocus,
    }),
    [
      disabled,
      focusSelectedItem,
      getItemText,
      moveSelection,
      open,
      registerItem,
      required,
      restoreTriggerFocus,
      setOpen,
      setValue,
      value,
    ],
  );

  return <SelectContextProvider value={contextValue}>{props.children}</SelectContextProvider>;
}
