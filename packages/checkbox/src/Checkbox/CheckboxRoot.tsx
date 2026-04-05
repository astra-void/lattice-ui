import { React, Slot, useControllableState } from "@lattice-ui/core";
import { useStateMotion } from "@lattice-ui/motion";
import { CheckboxContextProvider } from "./context";
import type { CheckboxProps, CheckedState } from "./types";

function getNextCheckedState(checked: CheckedState) {
  if (checked === "indeterminate") {
    return true;
  }

  return !checked;
}

export function CheckboxRoot(props: CheckboxProps) {
  const [checked, setCheckedState] = useControllableState<CheckedState>({
    value: props.checked,
    defaultValue: props.defaultChecked ?? false,
    onChange: props.onCheckedChange,
  });

  const disabled = props.disabled === true;
  const required = props.required === true;
  const rootRef = React.useRef<TextButton>();

  const __motionRef = useStateMotion(checked !== false, {} as unknown, false);
  React.useLayoutEffect(() => {
    if (__motionRef.current && rootRef.current !== __motionRef.current) {
      rootRef.current = __motionRef.current as unknown;
    }
  }, [__motionRef]);

  const setChecked = React.useCallback(
    (nextChecked: CheckedState) => {
      if (disabled) {
        return;
      }

      setCheckedState(nextChecked);
    },
    [disabled, setCheckedState],
  );

  const toggle = React.useCallback(() => {
    if (disabled) {
      return;
    }

    setCheckedState(getNextCheckedState(checked));
  }, [checked, disabled, setCheckedState]);

  const contextValue = React.useMemo(
    () => ({
      checked,
      setChecked,
      disabled,
      required,
    }),
    [checked, disabled, required, setChecked],
  );

  const child = props.children;

  return (
    <CheckboxContextProvider value={contextValue}>
      {props.asChild ? (
        (() => {
          if (!React.isValidElement(child)) {
            error("[Checkbox] `asChild` requires a child element.");
          }

          return (
            <Slot Active={!disabled} Event={{ Activated: toggle }} Selectable={!disabled} ref={rootRef}>
              {child}
            </Slot>
          );
        })()
      ) : (
        <textbutton
          Active={!disabled}
          AutoButtonColor={false}
          BackgroundColor3={checked !== false ? Color3.fromRGB(88, 142, 255) : Color3.fromRGB(59, 66, 84)}
          BorderSizePixel={0}
          Event={{ Activated: toggle }}
          Selectable={!disabled}
          Size={UDim2.fromOffset(160, 36)}
          Text={checked === "indeterminate" ? "Indeterminate" : checked ? "Checked" : "Unchecked"}
          TextColor3={disabled ? Color3.fromRGB(145, 152, 168) : Color3.fromRGB(240, 244, 252)}
          TextSize={15}
          ref={rootRef}
        >
          {child}
        </textbutton>
      )}
    </CheckboxContextProvider>
  );
}
