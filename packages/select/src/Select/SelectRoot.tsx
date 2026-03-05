import { React, useControllableState } from "@lattice-ui/core";
import { SelectContextProvider } from "./context";
import type { SelectItemRegistration, SelectProps } from "./types";

function getOrderedItems(items: Array<SelectItemRegistration>) {
  const ordered = [...items];
  ordered.sort((left, right) => left.order < right.order);
  return ordered;
}

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
  const loop = props.loop ?? true;
  const keyboardNavigation = props.keyboardNavigation === true;

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
    return getOrderedItems(itemEntriesRef.current);
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

  const contextValue = React.useMemo(
    () => ({
      open,
      setOpen,
      value,
      setValue,
      disabled,
      required,
      loop,
      keyboardNavigation,
      triggerRef,
      contentRef,
      registerItem,
      getOrderedItems: resolveOrderedItems,
      getItemText,
    }),
    [disabled, getItemText, keyboardNavigation, loop, open, registerItem, required, resolveOrderedItems, setOpen, setValue, value],
  );

  return <SelectContextProvider value={contextValue}>{props.children}</SelectContextProvider>;
}
