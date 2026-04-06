import { React, Slot } from "@lattice-ui/core";
import { useStateMotion } from "@lattice-ui/motion";
import type { ToastRootProps } from "./types";

const TOAST_TWEEN_INFO = new TweenInfo(0.14, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);

function buildToastTransition(): unknown {
  return {
    enter: {
      tweenInfo: TOAST_TWEEN_INFO,
      from: {
        BackgroundTransparency: 1,
      },
      to: {
        BackgroundTransparency: 0,
      },
    },
    exit: {
      tweenInfo: TOAST_TWEEN_INFO,
      to: {
        BackgroundTransparency: 1,
      },
    },
  };
}

export function ToastRoot(props: ToastRootProps) {
  const visible = props.visible ?? true;
  const rootRef = React.useRef<Frame>();
  const motionTransition = React.useMemo(() => {
    return buildToastTransition();
  }, [props.transition]);

  const __motionRef = useStateMotion<Frame>(visible, motionTransition ?? {}, false);
  React.useLayoutEffect(() => {
    if (__motionRef.current && rootRef.current !== __motionRef.current) {
      rootRef.current = __motionRef.current;
    }
  }, [__motionRef]);

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[ToastRoot] `asChild` requires a child element.");
    }

    return (
      <Slot Visible={true} ref={rootRef}>
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
      ref={rootRef}
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
