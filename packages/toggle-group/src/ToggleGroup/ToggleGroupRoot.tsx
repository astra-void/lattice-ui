import { React, Slot, useControllableState } from "@lattice-ui/core";
import { RovingFocusGroup } from "@lattice-ui/focus";
import { ToggleGroupContextProvider } from "./context";
import type { ToggleGroupProps } from "./types";

function normalizeMultiple(value: unknown): Array<string> {
  if (!typeIs(value, "table")) {
    return [];
  }

  const nextValues: Array<string> = [];
  const seenValues: Record<string, true> = {};

  for (const entry of value as Array<unknown>) {
    if (!typeIs(entry, "string")) {
      continue;
    }

    if (seenValues[entry]) {
      continue;
    }

    seenValues[entry] = true;
    nextValues.push(entry);
  }

  return nextValues;
}

export function ToggleGroupRoot(props: ToggleGroupProps) {
  const disabled = props.disabled === true;
  const loop = props.loop ?? true;
  const orientation = props.orientation ?? "horizontal";

  const [singleValue, setSingleValueState] = useControllableState<string | undefined>({
    value: props.type === "single" ? props.value : undefined,
    defaultValue: props.type === "single" ? props.defaultValue : undefined,
    onChange: (nextValue) => {
      if (props.type === "single") {
        props.onValueChange?.(nextValue);
      }
    },
  });

  const [multipleValue, setMultipleValueState] = useControllableState<Array<string>>({
    value:
      props.type === "multiple" ? (props.value !== undefined ? normalizeMultiple(props.value) : undefined) : undefined,
    defaultValue: props.type === "multiple" ? normalizeMultiple(props.defaultValue ?? []) : [],
    onChange: (nextValue) => {
      if (props.type === "multiple") {
        props.onValueChange?.(normalizeMultiple(nextValue));
      }
    },
  });

  const isPressed = React.useCallback(
    (itemValue: string) => {
      if (props.type === "single") {
        return singleValue === itemValue;
      }

      return multipleValue.includes(itemValue);
    },
    [multipleValue, props.type, singleValue],
  );

  const toggleValue = React.useCallback(
    (itemValue: string) => {
      if (disabled) {
        return;
      }

      if (props.type === "single") {
        setSingleValueState(singleValue === itemValue ? undefined : itemValue);
        return;
      }

      const currentValues = normalizeMultiple(multipleValue);
      const nextValues = currentValues.includes(itemValue)
        ? currentValues.filter((value) => value !== itemValue)
        : [...currentValues, itemValue];
      setMultipleValueState(nextValues);
    },
    [disabled, multipleValue, props.type, setMultipleValueState, setSingleValueState, singleValue],
  );

  const contextValue = React.useMemo(
    () => ({
      type: props.type,
      disabled,
      orientation,
      loop,
      isPressed,
      toggleValue,
    }),
    [disabled, isPressed, loop, orientation, props.type, toggleValue],
  );

  const groupNode = props.asChild ? (
    (() => {
      const child = props.children;
      if (!React.isValidElement(child)) {
        error("[ToggleGroup] `asChild` requires a child element.");
      }

      return <Slot>{child}</Slot>;
    })()
  ) : (
    <frame BackgroundTransparency={1} BorderSizePixel={0} Size={UDim2.fromOffset(0, 0)}>
      {props.children}
    </frame>
  );

  return (
    <ToggleGroupContextProvider value={contextValue}>
      <RovingFocusGroup active={!disabled} autoFocus="none" loop={loop} orientation={orientation}>
        {groupNode}
      </RovingFocusGroup>
    </ToggleGroupContextProvider>
  );
}
