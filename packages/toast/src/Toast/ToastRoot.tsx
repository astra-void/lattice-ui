import { React, Slot } from "@lattice-ui/core";
import { type MotionConfig, useStateMotion } from "@lattice-ui/motion";
import type { ToastRootProps } from "./types";

const TOAST_TWEEN_INFO = new TweenInfo(0.14, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);

function mergeMotionConfig(baseConfig: MotionConfig, overrideConfig?: MotionConfig): MotionConfig {
  if (!overrideConfig) {
    return baseConfig;
  }

  return {
    entering: { ...baseConfig.entering, ...overrideConfig.entering },
    entered: { ...baseConfig.entered, ...overrideConfig.entered },
    exiting: { ...baseConfig.exiting, ...overrideConfig.exiting },
  };
}

function buildToastTransition(): MotionConfig {
  return {
    entering: {
      tweenInfo: TOAST_TWEEN_INFO,
      initial: {
        BackgroundTransparency: 1,
      },
      goals: {
        BackgroundTransparency: 0,
      },
    },
    entered: {
      goals: {
        BackgroundTransparency: 0,
      },
    },
    exiting: {
      tweenInfo: TOAST_TWEEN_INFO,
      goals: {
        BackgroundTransparency: 1,
      },
    },
  };
}

export function ToastRoot(props: ToastRootProps) {
  const visible = props.visible ?? true;
  const motionTransition = React.useMemo(() => {
    return mergeMotionConfig(buildToastTransition(), props.transition);
  }, [props.transition]);

  const motionRef = useStateMotion<Frame>(visible, motionTransition, false);

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[ToastRoot] `asChild` requires a child element.");
    }

    return (
      <Slot Visible={true} ref={motionRef}>
        {child}
      </Slot>
    );
  }

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(38, 45, 59)}
      BackgroundTransparency={0}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(320, 72)}
      Visible={true}
      ref={motionRef}
    >
      <uicorner CornerRadius={new UDim(0, 10)} />
      <uipadding
        PaddingBottom={new UDim(0, 8)}
        PaddingLeft={new UDim(0, 10)}
        PaddingRight={new UDim(0, 10)}
        PaddingTop={new UDim(0, 8)}
      />
      {props.children}
    </frame>
  );
}
