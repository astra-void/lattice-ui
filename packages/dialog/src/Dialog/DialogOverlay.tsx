import {
  getMotionTransitionExitFallbackMs,
  type MotionTransition,
  mergeMotionTransition,
  React,
  Slot,
  useMotionTween,
} from "@lattice-ui/core";
import { Presence } from "@lattice-ui/layer";
import { useDialogContext } from "./context";
import type { DialogOverlayProps } from "./types";

const OVERLAY_TWEEN_INFO = new TweenInfo(0.15, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);

function buildDialogOverlayTransition(): MotionTransition {
  return {
    enter: {
      tweenInfo: OVERLAY_TWEEN_INFO,
      from: {
        BackgroundTransparency: 1,
      },
      to: {
        BackgroundTransparency: 0.35,
      },
    },
    exit: {
      tweenInfo: OVERLAY_TWEEN_INFO,
      to: {
        BackgroundTransparency: 1,
      },
    },
  };
}

type DialogOverlayImplProps = {
  visible: boolean;
  transition?: MotionTransition | false;
  onDismiss: () => void;
  onExitComplete?: () => void;
  children?: React.ReactElement;
  asChild?: boolean;
};

function DialogOverlayImpl(props: DialogOverlayImplProps) {
  const overlayRef = React.useRef<TextButton>();
  const motionTransition = React.useMemo(() => {
    return mergeMotionTransition(buildDialogOverlayTransition(), props.transition);
  }, [props.transition]);

  useMotionTween(overlayRef as React.MutableRefObject<Instance | undefined>, {
    active: props.visible,
    onExitComplete: props.onExitComplete,
    transition: motionTransition,
  });

  const handleActivated = React.useCallback(() => {
    props.onDismiss();
  }, [props.onDismiss]);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[DialogOverlay] `asChild` requires a child element.");
    }

    return (
      <Slot Active={props.visible} Event={{ Activated: handleActivated }} Visible={props.visible} ref={overlayRef}>
        {child}
      </Slot>
    );
  }

  return (
    <textbutton
      Active={props.visible}
      AutoButtonColor={false}
      BackgroundColor3={Color3.fromRGB(8, 10, 14)}
      BackgroundTransparency={0.35}
      BorderSizePixel={0}
      Event={{ Activated: handleActivated }}
      Position={UDim2.fromScale(0, 0)}
      Selectable={false}
      Size={UDim2.fromScale(1, 1)}
      Text=""
      TextTransparency={1}
      Visible={props.visible}
      ZIndex={5}
      ref={overlayRef}
    />
  );
}

export function DialogOverlay(props: DialogOverlayProps) {
  const dialogContext = useDialogContext();
  const open = dialogContext.open;
  const shouldRender = open || props.forceMount === true;

  if (!shouldRender) {
    return undefined;
  }

  const transition = props.transition;
  const exitFallbackMs = getMotionTransitionExitFallbackMs(transition);

  if (props.forceMount) {
    return (
      <DialogOverlayImpl
        asChild={props.asChild}
        onDismiss={() => dialogContext.setOpen(false)}
        transition={transition}
        visible={open}
      >
        {props.children}
      </DialogOverlayImpl>
    );
  }

  return (
    <Presence
      exitFallbackMs={exitFallbackMs}
      present={open}
      render={(state) => (
        <DialogOverlayImpl
          asChild={props.asChild}
          onDismiss={() => dialogContext.setOpen(false)}
          onExitComplete={state.onExitComplete}
          transition={transition}
          visible={true}
        >
          {props.children}
        </DialogOverlayImpl>
      )}
    />
  );
}
