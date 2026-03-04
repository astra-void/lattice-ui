import { React, useControllableState } from "@lattice-ui/core";
import { TextareaContextProvider } from "./context";
import type { TextareaProps } from "./types";

export function TextareaRoot(props: TextareaProps) {
  const [value, setValueState] = useControllableState<string>({
    value: props.value,
    defaultValue: props.defaultValue ?? "",
    onChange: props.onValueChange,
  });

  const disabled = props.disabled === true;
  const readOnly = props.readOnly === true;
  const required = props.required === true;
  const invalid = props.invalid === true;
  const autoResize = props.autoResize ?? true;
  const minRows = math.max(1, props.minRows ?? 3);
  const maxRows = props.maxRows !== undefined ? math.max(minRows, props.maxRows) : undefined;

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
      autoResize,
      minRows,
      maxRows,
      inputRef,
    }),
    [autoResize, commitValue, disabled, invalid, maxRows, minRows, props.name, readOnly, required, setValue, value],
  );

  return <TextareaContextProvider value={contextValue}>{props.children}</TextareaContextProvider>;
}

export { TextareaRoot as Textarea };
