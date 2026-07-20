import {
  getPassthroughProps,
  getSlotChild,
  React,
  Slot,
  toSlotProps,
  useControllableState,
} from "@lattice-ui/react-runtime";
import { ToggleGroupContextProvider } from "./context";
import type { ToggleGroupProps } from "./types";

const OWN_PROPS = ["type", "value", "defaultValue", "onValueChange", "disabled", "asChild", "children"] as const;

// Roblox instance defaults are themselves a look: a bare `frame` renders an opaque grey box.
// Neutralize only that, and leave every real appearance decision to the consumer. Passthrough props
// are spread after these, so they stay overridable.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

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
      isPressed,
      toggleValue,
    }),
    [disabled, isPressed, props.type, toggleValue],
  );

  const passthrough = getPassthroughProps<Frame>(props, OWN_PROPS);

  const groupNode = props.asChild ? (
    (() => {
      const child = props.children;
      if (getSlotChild(child) === undefined) {
        error("[ToggleGroup] `asChild` requires a child element.");
      }

      // No neutral defaults here: the rendered element belongs to the consumer.
      return <Slot {...toSlotProps(passthrough)}>{child}</Slot>;
    })()
  ) : (
    <frame {...NEUTRAL_PROPS} {...passthrough}>
      {props.children}
    </frame>
  );

  return <ToggleGroupContextProvider value={contextValue}>{groupNode}</ToggleGroupContextProvider>;
}
