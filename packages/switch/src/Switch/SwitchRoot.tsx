import { type MotionTransition, React, Slot, useControllableState, useMotionTween } from "@lattice-ui/core";
import { SwitchContextProvider } from "./context";
import type { SwitchProps } from "./types";

const TRACK_TWEEN_INFO = new TweenInfo(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);
const TRACK_EXIT_TWEEN_INFO = new TweenInfo(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.In);

const transition = {
  enter: {
    tweenInfo: TRACK_TWEEN_INFO,
    to: {
      BackgroundColor3: Color3.fromRGB(86, 141, 255),
    },
  },
  exit: {
    tweenInfo: TRACK_EXIT_TWEEN_INFO,
    to: {
      BackgroundColor3: Color3.fromRGB(66, 73, 91),
    },
  },
} satisfies MotionTransition;

export function SwitchRoot(props: SwitchProps) {
  const [checked, setCheckedState] = useControllableState<boolean>({
    value: props.checked,
    defaultValue: props.defaultChecked ?? false,
    onChange: props.onCheckedChange,
  });

  const disabled = props.disabled === true;
  const rootRef = React.useRef<TextButton>();

  useMotionTween(rootRef as React.MutableRefObject<Instance | undefined>, {
    active: checked,
    transition,
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
            <Slot Active={!disabled} Event={{ Activated: toggle }} Selectable={!disabled}>
              {child}
            </Slot>
          );
        })()
      ) : (
        <textbutton
          Active={!disabled}
          AutoButtonColor={false}
          BackgroundColor3={Color3.fromRGB(66, 73, 91)}
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
