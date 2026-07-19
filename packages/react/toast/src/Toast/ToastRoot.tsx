import { createToastRevealRecipe, usePresenceMotionController } from "@lattice-ui/react-motion";
import { React, Slot } from "@lattice-ui/react-runtime";
import type { ToastRootProps } from "./types";

export function ToastRoot(props: ToastRootProps) {
  const visible = props.visible ?? true;
  const defaultTransition = React.useMemo(() => createToastRevealRecipe(), []);
  const transition = props.transition ?? defaultTransition;

  const motion = usePresenceMotionController<CanvasGroup>({
    present: visible,
    config: transition,
    onExitComplete: props.onExitComplete,
  });

  // Stay visible through the exiting phase so the exit animation can play;
  // the instance only hides once the presence controller reports "exited".
  const motionVisible = motion.mounted && motion.phase !== "exited";

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[ToastRoot] `asChild` requires a child element.");
    }

    return (
      <Slot Visible={motionVisible} ref={motion.ref}>
        {child}
      </Slot>
    );
  }

  return (
    <canvasgroup
      BackgroundColor3={Color3.fromRGB(38, 45, 59)}
      BackgroundTransparency={0}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(320, 72)}
      Visible={motionVisible}
      ref={motion.ref}
    >
      <uicorner CornerRadius={new UDim(0, 10)} />
      <uipadding
        PaddingBottom={new UDim(0, 8)}
        PaddingLeft={new UDim(0, 10)}
        PaddingRight={new UDim(0, 10)}
        PaddingTop={new UDim(0, 8)}
      />
      {props.children}
    </canvasgroup>
  );
}
