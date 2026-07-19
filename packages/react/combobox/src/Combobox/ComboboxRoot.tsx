import { React, useControllableState } from "@lattice-ui/react-runtime";
import { ComboboxContextProvider } from "./context";
import { type ComboboxOption, defaultComboboxFilter, resolveForcedComboboxValue } from "./logic";
import type { ComboboxItemRegistration, ComboboxProps } from "./types";

function getOrderedItems(items: Array<ComboboxItemRegistration>) {
  const ordered = [...items];
  ordered.sort((left, right) => {
    const leftLayoutOrder = left.getInstance()?.LayoutOrder ?? 0;
    const rightLayoutOrder = right.getInstance()?.LayoutOrder ?? 0;
    if (leftLayoutOrder !== rightLayoutOrder) {
      return leftLayoutOrder < rightLayoutOrder;
    }

    return left.order < right.order;
  });
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
    onChange: props.onValueChange,
  });

  const [inputValue, setInputValueState] = useControllableState<string>({
    value: props.inputValue,
    defaultValue: props.defaultInputValue ?? "",
    onChange: props.onInputValueChange,
  });
  const [visibleQueryValue, setVisibleQueryValue] = React.useState(inputValue);

  const disabled = props.disabled === true;
  const readOnly = props.readOnly === true;
  const required = props.required === true;
  const filterFn = props.filterFn ?? defaultComboboxFilter;

  const anchorRef = React.useRef<GuiObject>();
  const triggerRef = React.useRef<GuiObject>();
  const inputRef = React.useRef<TextBox>();
  const contentRef = React.useRef<GuiObject>();

  const itemEntriesRef = React.useRef<Array<ComboboxItemRegistration>>([]);
  const itemTextCacheRef = React.useRef<Record<string, string>>({});
  const programmaticInputValueRef = React.useRef<string | undefined>();
  const pendingClearRef = React.useRef(false);
  const hasOpenedRef = React.useRef(false);
  const [registryRevision, setRegistryRevision] = React.useState(0);

  const registerItem = React.useCallback((item: ComboboxItemRegistration) => {
    itemEntriesRef.current = itemEntriesRef.current.filter((entry) => entry.id !== item.id);
    itemEntriesRef.current.push(item);
    itemTextCacheRef.current[item.value] = item.getTextValue();
    setRegistryRevision((revision) => revision + 1);

    return () => {
      const index = itemEntriesRef.current.findIndex((entry) => entry.id === item.id);
      if (index >= 0) {
        itemEntriesRef.current.remove(index);
        // Keep the text cache entry so the selected label survives content
        // unmount (closed-state input sync and ComboboxValue read from it).
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
      if (selected) {
        const textValue = selected.getTextValue();
        itemTextCacheRef.current[candidateValue] = textValue;
        return textValue;
      }

      return itemTextCacheRef.current[candidateValue];
    },
    [resolveOrderedItems],
  );

  const syncInputFromValue = React.useCallback(() => {
    const nextInputValue = value !== undefined ? (getItemText(value) ?? "") : "";
    programmaticInputValueRef.current = nextInputValue;
    setInputValueState(nextInputValue);
  }, [getItemText, setInputValueState, value]);

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
      if (selected?.getDisabled()) {
        return;
      }

      pendingClearRef.current = false;
      setValueState(nextValue);
      const nextInputValue = getItemText(nextValue) ?? nextValue;
      programmaticInputValueRef.current = nextInputValue;
      setInputValueState(nextInputValue);
    },
    [disabled, getItemText, resolveOrderedItems, setInputValueState, setValueState],
  );

  const setInputValue = React.useCallback(
    (nextInputValue: string) => {
      if (disabled || readOnly) {
        return;
      }

      if (programmaticInputValueRef.current !== undefined && nextInputValue === programmaticInputValueRef.current) {
        programmaticInputValueRef.current = undefined;
        return;
      }

      programmaticInputValueRef.current = undefined;
      pendingClearRef.current = nextInputValue === "";
      setVisibleQueryValue((currentQueryValue) =>
        currentQueryValue === nextInputValue ? currentQueryValue : nextInputValue,
      );

      if (nextInputValue === inputValue) {
        return;
      }

      setInputValueState(nextInputValue);
      setOpenState(true);
    },
    [disabled, inputValue, readOnly, setInputValueState, setOpenState],
  );

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const orderedItems = resolveOrderedItems();
    if (orderedItems.size() === 0) {
      return;
    }

    const nextValue = resolveForcedComboboxValue(value, toOptions(orderedItems));
    if (nextValue !== undefined && nextValue !== value) {
      setValueState(nextValue);
    }
  }, [open, registryRevision, resolveOrderedItems, setValueState, value]);

  React.useEffect(() => {
    if (open) {
      hasOpenedRef.current = true;
      return;
    }

    // Never sync before the popup has opened at least once: items only mount
    // inside the content, so at mount time the registry and text cache are
    // empty and syncInputFromValue would erase defaultInputValue (and cannot
    // resolve defaultValue's label yet).
    if (!hasOpenedRef.current) {
      return;
    }

    const shouldClear = pendingClearRef.current;
    pendingClearRef.current = false;

    if (shouldClear && value !== undefined) {
      setValueState(undefined);
      programmaticInputValueRef.current = "";
      setInputValueState("");
    } else {
      syncInputFromValue();
    }

    setVisibleQueryValue((currentQueryValue) => (currentQueryValue === "" ? currentQueryValue : ""));
  }, [open, setInputValueState, setValueState, syncInputFromValue, value]);

  React.useEffect(() => {
    programmaticInputValueRef.current = undefined;
  }, [inputValue]);

  const queryValue = open ? visibleQueryValue : inputValue;

  const contextValue = React.useMemo(
    () => ({
      open,
      setOpen,
      value,
      setValue,
      inputValue,
      queryValue,
      setInputValue,
      syncInputFromValue,
      disabled,
      readOnly,
      required,
      filterFn,
      anchorRef,
      triggerRef,
      inputRef,
      contentRef,
      registerItem,
      getItemText,
    }),
    [
      disabled,
      filterFn,
      getItemText,
      inputValue,
      open,
      queryValue,
      readOnly,
      registerItem,
      required,
      resolveOrderedItems,
      setInputValue,
      setOpen,
      setValue,
      syncInputFromValue,
      value,
      visibleQueryValue,
    ],
  );

  return <ComboboxContextProvider value={contextValue}>{props.children}</ComboboxContextProvider>;
}

export { ComboboxRoot as Combobox };
