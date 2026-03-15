import { React, useControllableState } from "@lattice-ui/core";
import { RadioGroupContextProvider } from "./context";
import type { RadioGroupProps } from "./types";

export function RadioGroupRoot(props: RadioGroupProps) {
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

  const setValue = React.useCallback(
    (nextValue: string) => {
      if (disabled) {
        return;
      }

      setValueState(nextValue);
    },
    [disabled, setValueState],
  );

  const contextValue = React.useMemo(
    () => ({
      value,
      setValue,
      disabled,
      required,
    }),
    [disabled, required, setValue, value],
  );

  return <RadioGroupContextProvider value={contextValue}>{props.children}</RadioGroupContextProvider>;
}
