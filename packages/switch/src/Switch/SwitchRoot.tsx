import { React, Slot, useControllableState } from "@lattice-ui/core";
import { createToggleResponseRecipe, useResponseMotion } from "@lattice-ui/motion";
import { SwitchContextProvider } from "./context";
import type { SwitchProps } from "./types";

const TRACK_ON_COLOR = Color3.fromRGB(86, 141, 255);
const TRACK_OFF_COLOR = Color3.fromRGB(66, 73, 91);

export function SwitchRoot(props: SwitchProps) {
  const [checked, setCheckedState] = useControllableState<boolean>({
    value: props.checked,
    defaultValue: props.defaultChecked ?? false,
    onChange: props.onCheckedChange,
  });

  const disabled = props.disabled === true;
  const motionTargets = React.useMemo(
    () => ({
      active: { BackgroundColor3: TRACK_ON_COLOR },
      inactive: { BackgroundColor3: TRACK_OFF_COLOR },
    }),
    [],
  );
  const motionConfig = React.useMemo(() => createToggleResponseRecipe(0.04), []);

  const motionRef = useResponseMotion<GuiObject>(checked, motionTargets, motionConfig);

  const setChecked = React.useCallback(
    (nextChecked: boolean) => {
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
    setCheckedState(!checked);
  }, [checked, disabled, setCheckedState]);

  const contextValue = React.useMemo(
    () => ({
      checked,
      setChecked,
      disabled,
    }),
    [checked, disabled, setChecked],
  );

  const child = props.children;

  return (
    <SwitchContextProvider value={contextValue}>
      {props.asChild ? (
        (() => {
          if (!React.isValidElement(child)) {
            error("[Switch] `asChild` requires a child element.");
          }

          return (
            <Slot Active={!disabled} Event={{ Activated: toggle }} Selectable={!disabled} ref={motionRef}>
              {child}
            </Slot>
          );
        })()
      ) : (
        <textbutton
          Active={!disabled}
          AutoButtonColor={false}
          BorderSizePixel={0}
          Event={{ Activated: toggle }}
          Selectable={!disabled}
          Size={UDim2.fromOffset(160, 36)}
          Text={checked ? "On" : "Off"}
          TextColor3={disabled ? Color3.fromRGB(145, 152, 168) : Color3.fromRGB(240, 244, 252)}
          TextSize={15}
          ref={motionRef as React.MutableRefObject<TextButton>}
        >
          {child}
        </textbutton>
      )}
    </SwitchContextProvider>
  );
}
