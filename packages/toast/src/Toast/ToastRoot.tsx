import { React, Slot } from "@lattice-ui/core";
import { createToastResponseRecipe, useResponseMotion } from "@lattice-ui/motion";
import type { ToastRootProps } from "./types";

export function ToastRoot(props: ToastRootProps) {
  const visible = props.visible ?? true;
  const transition = props.transition ?? createToastResponseRecipe();

  const motionRef = useResponseMotion<Frame>(
    visible,
    {
      active: { BackgroundTransparency: 0 },
      inactive: { BackgroundTransparency: 1 },
    },
    transition,
  );

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[ToastRoot] `asChild` requires a child element.");
    }

    return (
      <Slot Visible={visible} ref={motionRef}>
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
      Visible={visible}
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
