import { React, Slot, useControllableState } from "@lattice-ui/core";
import {
  motionTargets as motionTargetContracts,
  type ResponseMotionConfig,
  useResponseMotion,
} from "@lattice-ui/motion";
import { SwitchContextProvider } from "./context";
import type { SwitchProps } from "./types";

const DEFAULT_TRACK_ON_COLOR = Color3.fromRGB(86, 141, 255);
const DEFAULT_TRACK_OFF_COLOR = Color3.fromRGB(66, 73, 91);
const DEFAULT_DISABLED_TRACK_COLOR = Color3.fromRGB(103, 110, 128);

function shouldOwnTrackColor(props: SwitchProps) {
  if (props.trackColorMode !== undefined) {
    return props.trackColorMode === "switch";
  }

  if (!props.asChild) {
    return true;
  }

  // Backward compatibility: asChild switches implicitly opt into primitive-owned
  // track motion only when any track color prop is provided.
  return (
    props.trackOnColor !== undefined || props.trackOffColor !== undefined || props.disabledTrackColor !== undefined
  );
}

export function SwitchRoot(props: SwitchProps) {
  const [checked, setCheckedState] = useControllableState<boolean>({
    value: props.checked,
    defaultValue: props.defaultChecked ?? false,
    onChange: props.onCheckedChange,
  });

  const disabled = props.disabled === true;
  const ownTrackColor = shouldOwnTrackColor(props);
  const motionTargets = React.useMemo(() => {
    if (!ownTrackColor) {
      return { active: {}, inactive: {} };
    }

    const trackOnColor = props.trackOnColor ?? DEFAULT_TRACK_ON_COLOR;
    const trackOffColor = props.trackOffColor ?? DEFAULT_TRACK_OFF_COLOR;
    const disabledTrackColor = props.disabledTrackColor ?? DEFAULT_DISABLED_TRACK_COLOR;

    if (disabled) {
      return {
        active: { BackgroundColor3: disabledTrackColor },
        inactive: { BackgroundColor3: disabledTrackColor },
      };
    }

    return {
      active: { BackgroundColor3: trackOnColor },
      inactive: { BackgroundColor3: trackOffColor },
    };
  }, [disabled, ownTrackColor, props.disabledTrackColor, props.trackOffColor, props.trackOnColor]);
  const motionConfig = React.useMemo<ResponseMotionConfig>(
    () => ({
      target: motionTargetContracts.appearance("switch track response"),
      settle: { duration: 0.08, tempo: "swift", tone: "responsive" },
    }),
    [],
  );

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
