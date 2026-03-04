import { React, useControllableState } from "@lattice-ui/core";
import { ComboboxContextProvider } from "./context";
import {
  type ComboboxOption,
  defaultComboboxFilter,
  resolveComboboxInputValue,
  resolveForcedComboboxValue,
} from "./logic";
import type { ComboboxItemRegistration, ComboboxProps } from "./types";

function getOrderedItems(items: Array<ComboboxItemRegistration>) {
  const ordered = [...items];
  ordered.sort((left, right) => left.order < right.order);
  return ordered;
}

function toOptions(items: Array<ComboboxItemRegistration>): Array<ComboboxOption> {
  return items.map((item) => ({
    value: item.value,
    disabled: item.getDisabled(),
    textValue: item.getTextValue(),
  }));
}

export function ComboboxRoot(props: ComboboxProps) {
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

  const [inputValue, setInputValueState] = useControllableState<string>({
    value: props.inputValue,
    defaultValue: props.defaultInputValue ?? "",
    onChange: props.onInputValueChange,
  });

  const disabled = props.disabled === true;
  const readOnly = props.readOnly === true;
  const required = props.required === true;
  const loop = props.loop ?? true;
  const filterFn = props.filterFn ?? defaultComboboxFilter;

  const triggerRef = React.useRef<GuiObject>();
  const inputRef = React.useRef<TextBox>();
  const contentRef = React.useRef<GuiObject>();

  const itemEntriesRef = React.useRef<Array<ComboboxItemRegistration>>([]);
  const [registryRevision, setRegistryRevision] = React.useState(0);

  const registerItem = React.useCallback((item: ComboboxItemRegistration) => {
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

  const syncInputFromValue = React.useCallback(() => {
    const nextInputValue = resolveComboboxInputValue(value, toOptions(resolveOrderedItems()), "");
    setInputValueState(nextInputValue);
  }, [resolveOrderedItems, setInputValueState, value]);

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (disabled && nextOpen) {
        return;
      }

      setOpenState(nextOpen);

      if (!nextOpen) {
        syncInputFromValue();
      }
    },
    [disabled, setOpenState, syncInputFromValue],
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
      const nextInputValue = getItemText(nextValue) ?? nextValue;
      setInputValueState(nextInputValue);
    },
    [disabled, getItemText, resolveOrderedItems, setInputValueState, setValueState],
  );

  const setInputValue = React.useCallback(
    (nextInputValue: string) => {
      if (disabled || readOnly) {
        return;
      }

      setInputValueState(nextInputValue);
      setOpenState(true);
    },
    [disabled, readOnly, setInputValueState, setOpenState],
  );

  const getFilteredItems = React.useCallback(() => {
    const query = inputValue;
    return resolveOrderedItems().filter((item) => filterFn(item.getTextValue(), query));
  }, [filterFn, inputValue, resolveOrderedItems]);

  React.useEffect(() => {
    const orderedItems = resolveOrderedItems();
    const nextValue = resolveForcedComboboxValue(value, toOptions(orderedItems));
    if (nextValue !== value) {
      setValueState(nextValue);
    }
  }, [registryRevision, resolveOrderedItems, setValueState, value]);

  React.useEffect(() => {
    if (open) {
      return;
    }

    syncInputFromValue();
  }, [open, syncInputFromValue, value]);

  const contextValue = React.useMemo(
    () => ({
      open,
      setOpen,
      value,
      setValue,
      inputValue,
      setInputValue,
      syncInputFromValue,
      disabled,
      readOnly,
      required,
      loop,
      filterFn,
      triggerRef,
      inputRef,
      contentRef,
      registerItem,
      getOrderedItems: resolveOrderedItems,
      getFilteredItems,
      getItemText,
    }),
    [
      disabled,
      filterFn,
      getFilteredItems,
      getItemText,
      inputValue,
      loop,
      open,
      readOnly,
      registerItem,
      required,
      resolveOrderedItems,
      setInputValue,
      setOpen,
      setValue,
      syncInputFromValue,
      value,
    ],
  );

  return <ComboboxContextProvider value={contextValue}>{props.children}</ComboboxContextProvider>;
}

export { ComboboxRoot as Combobox };
