import {
  findOrderedSelectionEntry,
  focusOrderedSelectionEntry,
  getRelativeOrderedSelectionEntry,
  React,
  useControllableState,
} from "@lattice-ui/core";
import { RadioGroupContextProvider } from "./context";
import type { RadioGroupItemRegistration, RadioGroupProps } from "./types";

export function RadioGroupRoot(props: RadioGroupProps) {
  const orientation = props.orientation ?? "vertical";
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
  const itemEntriesRef = React.useRef<Array<RadioGroupItemRegistration>>([]);
  const [, setRegistryRevision] = React.useState(0);

  const setValue = React.useCallback(
    (nextValue: string) => {
      if (disabled) {
        return;
      }

      setValueState(nextValue);
    },
    [disabled, setValueState],
  );

  const registerItem = React.useCallback((item: RadioGroupItemRegistration) => {
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

  const moveSelection = React.useCallback(
    (fromValue: string, direction: -1 | 1) => {
      const currentItem =
        findOrderedSelectionEntry(itemEntriesRef.current, (item) => item.value === fromValue) ?? undefined;
      const nextItem = getRelativeOrderedSelectionEntry(itemEntriesRef.current, currentItem?.id, direction);
      if (!nextItem) {
        return;
      }

      focusOrderedSelectionEntry(nextItem);
      setValue(nextItem.value);
    },
    [setValue],
  );

  const contextValue = React.useMemo(
    () => ({
      value,
      setValue,
      disabled,
      required,
      orientation,
      registerItem,
      moveSelection,
    }),
    [disabled, moveSelection, orientation, registerItem, required, setValue, value],
  );

  return <RadioGroupContextProvider value={contextValue}>{props.children}</RadioGroupContextProvider>;
}
