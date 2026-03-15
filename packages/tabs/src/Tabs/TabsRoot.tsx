import {
  findOrderedSelectionEntry,
  focusOrderedSelectionEntry,
  getOrderedSelectionEntries,
  getRelativeOrderedSelectionEntry,
  React,
  useControllableState,
} from "@lattice-ui/core";
import { TabsContextProvider } from "./context";
import type { TabsProps, TabsTriggerRegistration } from "./types";

function resolveNextValue(
  currentValue: string | undefined,
  orderedTriggers: Array<TabsTriggerRegistration>,
  fallbackOrder: number | undefined,
) {
  const enabled = orderedTriggers.filter((trigger) => !trigger.getDisabled());
  if (enabled.size() === 0) {
    return undefined;
  }

  if (currentValue === undefined) {
    return enabled[0]?.value;
  }

  const selectedEnabled = enabled.find((trigger) => trigger.value === currentValue);
  if (selectedEnabled) {
    return selectedEnabled.value;
  }

  const selected = orderedTriggers.find((trigger) => trigger.value === currentValue);
  const anchorOrder = selected?.order ?? fallbackOrder;
  if (anchorOrder !== undefined) {
    const after = enabled.find((trigger) => trigger.order > anchorOrder);
    if (after) {
      return after.value;
    }
  }

  return enabled[0]?.value;
}

export function TabsRoot(props: TabsProps) {
  const orientation = props.orientation ?? "horizontal";
  const [value, setValueState] = useControllableState<string | undefined>({
    value: props.value,
    defaultValue: props.defaultValue,
    onChange: (nextValue) => {
      if (nextValue !== undefined) {
        props.onValueChange?.(nextValue);
      }
    },
  });

  const triggerRegistryRef = React.useRef<Array<TabsTriggerRegistration>>([]);
  const lastSelectedOrderRef = React.useRef<number>();
  const [registryRevision, setRegistryRevision] = React.useState(0);

  const registerTrigger = React.useCallback((trigger: TabsTriggerRegistration) => {
    triggerRegistryRef.current.push(trigger);
    setRegistryRevision((revision) => revision + 1);

    return () => {
      const index = triggerRegistryRef.current.findIndex((entry) => entry.id === trigger.id);
      if (index >= 0) {
        triggerRegistryRef.current.remove(index);
        setRegistryRevision((revision) => revision + 1);
      }
    };
  }, []);

  const setValue = React.useCallback(
    (nextValue: string) => {
      const orderedTriggers = getOrderedSelectionEntries(triggerRegistryRef.current);
      const selected = orderedTriggers.find((trigger) => trigger.value === nextValue && !trigger.getDisabled());
      if (selected) {
        lastSelectedOrderRef.current = selected.order;
      }

      setValueState(nextValue);
    },
    [setValueState],
  );

  const moveSelection = React.useCallback(
    (fromValue: string, direction: -1 | 1) => {
      const currentTrigger =
        findOrderedSelectionEntry(triggerRegistryRef.current, (trigger) => trigger.value === fromValue) ?? undefined;
      const nextTrigger = getRelativeOrderedSelectionEntry(triggerRegistryRef.current, currentTrigger?.id, direction);
      if (!nextTrigger) {
        return;
      }

      focusOrderedSelectionEntry(nextTrigger);
      setValue(nextTrigger.value);
    },
    [setValue],
  );

  React.useEffect(() => {
    const orderedTriggers = getOrderedSelectionEntries(triggerRegistryRef.current);
    const selected = orderedTriggers.find((trigger) => trigger.value === value && !trigger.getDisabled());
    if (selected) {
      lastSelectedOrderRef.current = selected.order;
    }

    const nextValue = resolveNextValue(value, orderedTriggers, lastSelectedOrderRef.current);
    if (nextValue !== value) {
      setValueState(nextValue);
    }
  }, [registryRevision, setValueState, value]);

  const contextValue = React.useMemo(
    () => ({
      value,
      orientation,
      setValue,
      registerTrigger,
      moveSelection,
    }),
    [moveSelection, orientation, registerTrigger, setValue, value],
  );

  return <TabsContextProvider value={contextValue}>{props.children}</TabsContextProvider>;
}
