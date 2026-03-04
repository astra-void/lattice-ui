import { React, useControllableState } from "@lattice-ui/core";
import { TextFieldContextProvider } from "./context";
import type { TextFieldProps } from "./types";

export function TextFieldRoot(props: TextFieldProps) {
  const [value, setValueState] = useControllableState<string>({
    value: props.value,
    defaultValue: props.defaultValue ?? "",
    onChange: props.onValueChange,
  });

  const disabled = props.disabled === true;
  const readOnly = props.readOnly === true;
  const required = props.required === true;
  const invalid = props.invalid === true;

  const inputRef = React.useRef<TextBox>();

  const setValue = React.useCallback(
    (nextValue: string) => {
      if (disabled || readOnly) {
        return;
      }

      setValueState(nextValue);
    },
    [disabled, readOnly, setValueState],
  );

  const commitValue = React.useCallback(
    (nextValue: string) => {
      props.onValueCommit?.(nextValue);
    },
    [props.onValueCommit],
  );

  const contextValue = React.useMemo(
    () => ({
      value,
      setValue,
      commitValue,
      disabled,
      readOnly,
      required,
      invalid,
      name: props.name,
      inputRef,
    }),
    [commitValue, disabled, invalid, props.name, readOnly, required, setValue, value],
  );

  return <TextFieldContextProvider value={contextValue}>{props.children}</TextFieldContextProvider>;
}
