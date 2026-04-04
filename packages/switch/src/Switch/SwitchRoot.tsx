import { React, Slot, useControllableState } from "@lattice-ui/core";
import { type MotionTransition } from "@lattice-ui/motion";
import { useMotionTween } from "@lattice-ui/motion";
import { SwitchContextProvider } from "./context";
import type { SwitchProps } from "./types";

const TRACK_ON_COLOR = Color3.fromRGB(86, 141, 255);
const TRACK_OFF_COLOR = Color3.fromRGB(66, 73, 91);
const TRACK_TWEEN_INFO = new TweenInfo(0.14, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);
const TRACK_EXIT_TWEEN_INFO = new TweenInfo(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.In);

function buildSwitchRootTransition(): MotionTransition {
  return {
    enter: {
      tweenInfo: TRACK_TWEEN_INFO,
      from: {
        BackgroundColor3: TRACK_OFF_COLOR,
      },
      to: {
        BackgroundColor3: TRACK_ON_COLOR,
      },
    },
    exit: {
      tweenInfo: TRACK_EXIT_TWEEN_INFO,
      from: {
        BackgroundColor3: TRACK_ON_COLOR,
      },
      to: {
        BackgroundColor3: TRACK_OFF_COLOR,
      },
    },
  };
}

export function SwitchRoot(props: SwitchProps) {
  const [checked, setCheckedState] = useControllableState<boolean>({
    value: props.checked,
    defaultValue: props.defaultChecked ?? false,
    onChange: props.onCheckedChange,
  });

  const disabled = props.disabled === true;
  const rootRef = React.useRef<TextButton>();
  const [motionReady, setMotionReady] = React.useState(false);
  const motionTransition = React.useMemo(() => buildSwitchRootTransition(), []);

  React.useEffect(() => {
    setMotionReady(true);
  }, []);

  useMotionTween(rootRef as React.MutableRefObject<Instance | undefined>, {
    active: checked,
    transition: motionReady ? motionTransition : false,
  });

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
            <Slot Active={!disabled} Event={{ Activated: toggle }} Selectable={!disabled} ref={rootRef}>
              {child}
            </Slot>
          );
        })()
      ) : (
        <textbutton
          Active={!disabled}
          AutoButtonColor={false}
          BackgroundColor3={checked ? TRACK_ON_COLOR : TRACK_OFF_COLOR}
          BorderSizePixel={0}
          Event={{ Activated: toggle }}
          Selectable={!disabled}
          Size={UDim2.fromOffset(160, 36)}
          Text={checked ? "On" : "Off"}
          TextColor3={disabled ? Color3.fromRGB(145, 152, 168) : Color3.fromRGB(240, 244, 252)}
          TextSize={15}
          ref={rootRef}
        >
          {child}
        </textbutton>
      )}
    </SwitchContextProvider>
  );
}
